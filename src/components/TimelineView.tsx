import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedReaction, runOnJS, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

// Only import Skia for native platforms
let Canvas: any = null;
let Group: any = null;
let Rect: any = null;
if (Platform.OS !== 'web') {
  try {
    const skia = require('@shopify/react-native-skia');
    Canvas = skia.Canvas;
    Group = skia.Group;
    Rect = skia.Rect;
  } catch {
    // Skia not available
  }
}

import { TimeAxis } from './TimeAxis';
import { TimelineBreadcrumb } from './TimelineBreadcrumb';
import { ALL_EVENTS } from '@/data/events';
import { assignTracks, filterVisible, type TrackMap } from '@/timeline/culling';
import {
  clampOffsetX,
  clampPixelsPerUnit,
  eventLabelFontSize,
  humanHistoryViewState,
  pixelsPerUnitToZoomLevel,
} from '@/timeline/lod';
import { viewportYearRange, yearToT, tToYear } from '@/timeline/scale';
import { type Continent, type TimelineEvent, type ZoomLevel } from '@/data/schema';
import {
  LANE_GAP,
  LANE_HEIGHT,
  LANE_LABEL_WIDTH,
  LANE_PADDING_V,
  TRACK_HEIGHT,
  colors,
  eventColor,
  spacing,
  typography,
  type Category,
} from '@/theme/tokens';

type Props = {
  activeCategories: Set<Category>;
  continent: Continent;
  onSelectEvent: (event: TimelineEvent) => void;
  /** Increment to animate back to the default human-history view. */
  resetKey?: number;
};

const LANE_ORDER: Category[] = ['erdzeitalter', 'zivilisation', 'natur', 'nation'];

const TOTAL_T_MIN = yearToT(-13_800_000_000);
const TOTAL_T_MAX = yearToT(2026); // "Heute" ist der rechte Rand
const T_HEUTE = yearToT(2026);

const LABEL_MIN_BAR_PX = 48;
const LABEL_MAX_WIDTH = 96;

/** Returns the pixel height of a lane with the given number of tracks. */
function laneHeightForTracks(n: number): number {
  return n * TRACK_HEIGHT + LANE_PADDING_V * 2;
}

/**
 * Collision-aware label visibility: checks collisions per track so events
 * in different tracks never suppress each other. Largest bars win.
 */
function computeLabelVisibleIds(
  visibleByLane: Map<Category, TimelineEvent[]>,
  tracksByLane: Map<Category, TrackMap>,
  jsOffsetX: number,
  jsPixelsPerUnit: number,
  canvasWidth: number,
): Set<string> {
  const result = new Set<string>();
  for (const [cat, events] of visibleByLane.entries()) {
    const trackMap = tracksByLane.get(cat);
    // Group events by track
    const byTrack = new Map<number, TimelineEvent[]>();
    for (const ev of events) {
      const t = trackMap?.get(ev.id) ?? 0;
      if (!byTrack.has(t)) byTrack.set(t, []);
      byTrack.get(t)!.push(ev);
    }
    for (const trackEvents of byTrack.values()) {
      const placed: Array<{ l: number; r: number }> = [];
      const sorted = [...trackEvents].sort((a, b) => {
        const wa = (yearToT(a.endYear ?? a.startYear) - yearToT(a.startYear)) * jsPixelsPerUnit;
        const wb = (yearToT(b.endYear ?? b.startYear) - yearToT(b.startYear)) * jsPixelsPerUnit;
        return wb - wa;
      });
      for (const ev of sorted) {
        const x = (yearToT(ev.startYear) - jsOffsetX) * jsPixelsPerUnit;
        const w = Math.max(
          0,
          (yearToT(ev.endYear ?? ev.startYear) - yearToT(ev.startYear)) * jsPixelsPerUnit,
        );
        if (w < LABEL_MIN_BAR_PX) continue;
        const visibleLeft = Math.max(x, 0);
        const visibleRight = Math.min(x + w, canvasWidth);
        if (visibleRight - visibleLeft < 6) continue;
        const lx = visibleLeft + 3;
        const rx = lx + Math.min(LABEL_MAX_WIDTH, visibleRight - visibleLeft - 6);
        if (placed.some((p) => lx < p.r && rx > p.l)) continue;
        placed.push({ l: lx, r: rx });
        result.add(ev.id);
      }
    }
  }
  return result;
}

export function TimelineView({ activeCategories, continent, onSelectEvent, resetKey = 0 }: Props) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = Math.max(0, screenWidth - LANE_LABEL_WIDTH);

  // Default view: −400 000 years → Heute at right edge
  const initState = humanHistoryViewState(canvasWidth);

  const offsetX = useSharedValue(initState.offsetX);
  const pixelsPerUnit = useSharedValue(initState.pixelsPerUnit);
  const startOffsetX = useSharedValue(0);
  const startPixelsPerUnit = useSharedValue(0);
  const startFocalT = useSharedValue(0);

  // JS-side mirrors updated from worklets via runOnJS
  const [jsOffsetX, setJsOffsetX] = useState(initState.offsetX);
  const [jsPixelsPerUnit, setJsPixelsPerUnit] = useState(initState.pixelsPerUnit);

  // Web: horizontal scroll position + ref for programmatic reset
  const [webScrollX, setWebScrollX] = useState(0);
  const webScrollRef = useRef<ScrollView>(null);

  // Ref so the reset effect always reads the current canvasWidth without re-subscribing
  const canvasWidthRef = useRef(canvasWidth);
  useLayoutEffect(() => {
    canvasWidthRef.current = canvasWidth;
  });

  // Animate to default view whenever resetKey increments (0 = initial mount, skip)
  useEffect(() => {
    if (resetKey === 0) return;
    const cw = canvasWidthRef.current;
    if (!cw) return;
    if (Platform.OS === 'web') {
      const ppu = humanHistoryViewState(cw).pixelsPerUnit;
      const heuteWebX = (T_HEUTE - TOTAL_T_MIN) * ppu;
      webScrollRef.current?.scrollTo({ x: Math.max(0, heuteWebX - cw), animated: true });
      return;
    }
    const state = humanHistoryViewState(cw);
    offsetX.value = withTiming(state.offsetX, { duration: 600 });
    pixelsPerUnit.value = withTiming(state.pixelsPerUnit, { duration: 600 });
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useAnimatedReaction(
    () => ({ o: offsetX.value, p: pixelsPerUnit.value }),
    (curr, prev) => {
      if (!prev || Math.abs(curr.o - prev.o) > 0.5 || Math.abs(curr.p - prev.p) > 0.5) {
        runOnJS(setJsOffsetX)(curr.o);
        runOnJS(setJsPixelsPerUnit)(curr.p);
      }
    },
    [],
  );

  const lanes = useMemo(
    () => LANE_ORDER.filter((c) => activeCategories.has(c)),
    [activeCategories],
  );

  const zoomLevel: ZoomLevel = useMemo(
    () => pixelsPerUnitToZoomLevel(jsPixelsPerUnit),
    [jsPixelsPerUnit],
  );

  const visibleByLane = useMemo(() => {
    const range = viewportYearRange(canvasWidth, jsOffsetX, jsPixelsPerUnit);
    const out = new Map<Category, TimelineEvent[]>();
    for (const cat of lanes) {
      out.set(
        cat,
        filterVisible(ALL_EVENTS, {
          startYear: range.startYear,
          endYear: range.endYear,
          zoomLevel,
          categories: new Set<Category>([cat]),
          continent,
        }),
      );
    }
    return out;
  }, [canvasWidth, jsOffsetX, jsPixelsPerUnit, lanes, zoomLevel, continent]);

  const tracksByLane = useMemo(() => {
    const out = new Map<Category, TrackMap>();
    for (const [cat, events] of visibleByLane) out.set(cat, assignTracks(events));
    return out;
  }, [visibleByLane]);

  const laneTrackCounts = useMemo(() => {
    const out = new Map<Category, number>();
    for (const [cat, tm] of tracksByLane) {
      const max = tm.size === 0 ? 0 : Math.max(...tm.values());
      out.set(cat, max + 1);
    }
    return out;
  }, [tracksByLane]);

  const laneTops = useMemo(() => {
    const tops: number[] = [];
    let cursor = 0;
    for (const cat of lanes) {
      tops.push(cursor);
      cursor += laneHeightForTracks(laneTrackCounts.get(cat) ?? 1) + LANE_GAP;
    }
    return tops;
  }, [lanes, laneTrackCounts]);

  const labelVisibleIds = useMemo(
    () =>
      computeLabelVisibleIds(visibleByLane, tracksByLane, jsOffsetX, jsPixelsPerUnit, canvasWidth),
    [visibleByLane, tracksByLane, jsOffsetX, jsPixelsPerUnit, canvasWidth],
  );

  const viewportRange = useMemo(
    () => viewportYearRange(canvasWidth, jsOffsetX, jsPixelsPerUnit),
    [canvasWidth, jsOffsetX, jsPixelsPerUnit],
  );

  const heutePx = useMemo(
    () => (T_HEUTE - jsOffsetX) * jsPixelsPerUnit,
    [jsOffsetX, jsPixelsPerUnit],
  );
  const heuteVisible = heutePx >= -1 && heutePx <= canvasWidth + 1;

  // Pan: activeOffsetX / failOffsetY lets vertical swipes pass to the parent ScrollView
  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-8, 8])
    .onStart(() => {
      startOffsetX.value = offsetX.value;
    })
    .onUpdate((e) => {
      const raw = startOffsetX.value - e.translationX / pixelsPerUnit.value;
      offsetX.value = clampOffsetX(raw, pixelsPerUnit.value, canvasWidth);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      startPixelsPerUnit.value = pixelsPerUnit.value;
      startFocalT.value = offsetX.value + e.focalX / pixelsPerUnit.value;
    })
    .onUpdate((e) => {
      const next = clampPixelsPerUnit(startPixelsPerUnit.value * e.scale);
      pixelsPerUnit.value = next;
      offsetX.value = clampOffsetX(startFocalT.value - e.focalX / next, next, canvasWidth);
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const canvasHeight = Math.max(
    lanes.reduce(
      (sum, cat, i) =>
        sum +
        laneHeightForTracks(laneTrackCounts.get(cat) ?? 1) +
        (i < lanes.length - 1 ? LANE_GAP : 0),
      0,
    ),
    80,
  );

  const handleTap = (event: TimelineEvent) => onSelectEvent(event);

  const zoomIn = () => {
    if (Platform.OS === 'web') {
      const centerT = TOTAL_T_MIN + (webScrollX + canvasWidth / 2) / jsPixelsPerUnit;
      const newPPU = clampPixelsPerUnit(jsPixelsPerUnit * 1.5);
      pixelsPerUnit.value = newPPU;
      setJsPixelsPerUnit(newPPU);
      const newScrollX = Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2);
      requestAnimationFrame(() => {
        webScrollRef.current?.scrollTo({ x: newScrollX, animated: false });
      });
    } else {
      const center = offsetX.value + canvasWidth / (2 * pixelsPerUnit.value);
      const next = clampPixelsPerUnit(pixelsPerUnit.value * 1.5);
      const nextOffset = clampOffsetX(center - canvasWidth / (2 * next), next, canvasWidth);
      pixelsPerUnit.value = withTiming(next, { duration: 300 });
      offsetX.value = withTiming(nextOffset, { duration: 300 });
    }
  };

  const zoomOut = () => {
    if (Platform.OS === 'web') {
      const centerT = TOTAL_T_MIN + (webScrollX + canvasWidth / 2) / jsPixelsPerUnit;
      const newPPU = clampPixelsPerUnit(jsPixelsPerUnit / 1.5);
      pixelsPerUnit.value = newPPU;
      setJsPixelsPerUnit(newPPU);
      const newScrollX = Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2);
      requestAnimationFrame(() => {
        webScrollRef.current?.scrollTo({ x: newScrollX, animated: false });
      });
    } else {
      const center = offsetX.value + canvasWidth / (2 * pixelsPerUnit.value);
      const next = clampPixelsPerUnit(pixelsPerUnit.value / 1.5);
      const nextOffset = clampOffsetX(center - canvasWidth / (2 * next), next, canvasWidth);
      pixelsPerUnit.value = withTiming(next, { duration: 300 });
      offsetX.value = withTiming(nextOffset, { duration: 300 });
    }
  };

  // ─── Web fallback ─────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    const WEB_PPU = jsPixelsPerUnit;
    const webCanvasWidth = Math.ceil((TOTAL_T_MAX - TOTAL_T_MIN) * WEB_PPU);
    const webOffsetAtZero = TOTAL_T_MIN;
    const webOffsetX = webOffsetAtZero + webScrollX / WEB_PPU;

    const heuteWebX = (T_HEUTE - TOTAL_T_MIN) * WEB_PPU;
    const initWebScrollX = Math.max(0, heuteWebX - canvasWidth);

    const webVisibleByLane = new Map<Category, TimelineEvent[]>();
    const visibleStartYear = tToYear(webOffsetX);
    const visibleEndYear = tToYear(webOffsetX + canvasWidth / WEB_PPU);
    for (const cat of lanes) {
      webVisibleByLane.set(
        cat,
        filterVisible(ALL_EVENTS, {
          startYear: visibleStartYear,
          endYear: visibleEndYear,
          zoomLevel,
          categories: new Set<Category>([cat]),
          continent,
        }),
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.axisRow, { position: 'sticky', top: 0, zIndex: 10 } as any]}>
          <View style={{ width: LANE_LABEL_WIDTH }} />
          <TimeAxis
            offsetX={webOffsetX}
            pixelsPerUnit={WEB_PPU}
            canvasWidth={canvasWidth}
            zoomLevel={zoomLevel}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <TimelineBreadcrumb
              startYear={viewportRange.startYear}
              endYear={viewportRange.endYear}
            />
          </View>
        </View>
        <View style={styles.container}>
          <View style={[styles.labels, { position: 'sticky', left: 0, zIndex: 5 } as any]}>
            {lanes.map((cat, idx) => (
              <View
                key={cat}
                style={[
                  styles.label,
                  {
                    top: laneTops[idx],
                    height: laneHeightForTracks(laneTrackCounts.get(cat) ?? 1),
                    borderLeftColor: colors.category[cat],
                  },
                ]}
              >
                <Text style={styles.labelText}>{t(`category.${cat}`)}</Text>
              </View>
            ))}
          </View>
          <ScrollView
            ref={webScrollRef}
            horizontal
            style={{ flex: 1, backgroundColor: colors.bg }}
            scrollEventThrottle={16}
            onScroll={(e) => setWebScrollX(e.nativeEvent.contentOffset.x)}
            contentOffset={{ x: initWebScrollX, y: 0 }}
          >
            <View style={{ width: webCanvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                const events = webVisibleByLane.get(cat) ?? [];
                const webTrackMap = assignTracks(events);
                const lblSize = eventLabelFontSize(zoomLevel);
                return (
                  <View key={cat}>
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: laneTop,
                        width: webCanvasWidth,
                        height: laneH,
                        backgroundColor: colors.laneBg[cat],
                      }}
                    />
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      const x = (startT - webOffsetAtZero) * WEB_PPU;
                      const w = Math.max(2, (endT - startT) * WEB_PPU);
                      const trackIdx = webTrackMap.get(ev.id) ?? 0;
                      const barTop = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                      const barHeight = TRACK_HEIGHT - 8;
                      const stickyLabelLeft =
                        w >= LABEL_MIN_BAR_PX ? Math.max(x + 3, webScrollX + 3) : null;
                      const stickyLabelMaxW =
                        stickyLabelLeft !== null ? Math.max(0, x + w - stickyLabelLeft - 3) : 0;
                      return (
                        <React.Fragment key={ev.id}>
                          <View
                            onStartShouldSetResponder={() => {
                              handleTap(ev);
                              return false;
                            }}
                            style={
                              {
                                position: 'absolute',
                                left: x,
                                top: barTop,
                                width: w,
                                height: barHeight,
                                backgroundColor: eventColor(ev),
                                borderRadius: 3,
                                cursor: 'pointer',
                              } as any
                            }
                          />
                          {stickyLabelLeft !== null && stickyLabelMaxW > 10 && lblSize > 0 && (
                            <View
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                left: stickyLabelLeft,
                                top: barTop + barHeight / 2 - lblSize / 2,
                                maxWidth: stickyLabelMaxW,
                              }}
                            >
                              <Text
                                numberOfLines={1}
                                style={{
                                  ...typography.caption,
                                  fontSize: lblSize,
                                  color: colors.textPrimary,
                                }}
                              >
                                {ev.title}
                              </Text>
                            </View>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </View>
                );
              })}
              <View
                style={{
                  position: 'absolute',
                  left: heuteWebX - 0.75,
                  top: 0,
                  width: 1.5,
                  height: canvasHeight,
                  backgroundColor: '#FF5050',
                  pointerEvents: 'none',
                }}
              />
            </View>
          </ScrollView>
        </View>
        <View
          style={[styles.zoomButtons, { position: 'fixed', right: 12, bottom: 12 } as any]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} accessibilityLabel="Zoom in">
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} accessibilityLabel="Zoom out">
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Native (Skia) ────────────────────────────────────────────────────────
  return (
    <View>
      <View style={styles.axisRow}>
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <TimeAxis
          offsetX={jsOffsetX}
          pixelsPerUnit={jsPixelsPerUnit}
          canvasWidth={canvasWidth}
          zoomLevel={zoomLevel}
        />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <TimelineBreadcrumb startYear={viewportRange.startYear} endYear={viewportRange.endYear} />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.labels}>
          {lanes.map((cat, idx) => (
            <View
              key={cat}
              style={[
                styles.label,
                {
                  top: laneTops[idx],
                  height: laneHeightForTracks(laneTrackCounts.get(cat) ?? 1),
                  borderLeftColor: colors.category[cat],
                },
              ]}
            >
              <Text style={styles.labelText}>{t(`category.${cat}`)}</Text>
            </View>
          ))}
        </View>

        <GestureDetector gesture={gesture}>
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                const events = visibleByLane.get(cat) ?? [];
                const trackMap = tracksByLane.get(cat);
                return (
                  <Group key={cat}>
                    <Rect
                      x={0}
                      y={laneTop}
                      width={canvasWidth}
                      height={laneH}
                      color={colors.laneBg[cat]}
                    />
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                      const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                      const trackIdx = trackMap?.get(ev.id) ?? 0;
                      const barY = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                      const barH = TRACK_HEIGHT - 8;
                      return (
                        <Rect
                          key={ev.id}
                          x={x}
                          y={barY}
                          width={w}
                          height={barH}
                          color={eventColor(ev)}
                        />
                      );
                    })}
                  </Group>
                );
              })}
              {heuteVisible && (
                <Rect
                  x={heutePx - 0.75}
                  y={0}
                  width={1.5}
                  height={canvasHeight}
                  color="rgba(255, 80, 80, 0.9)"
                />
              )}
            </Canvas>

            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const events = visibleByLane.get(cat) ?? [];
                const trackMap = tracksByLane.get(cat);
                const lblSize = eventLabelFontSize(zoomLevel);
                return [
                  ...events.map((ev) => {
                    const startT = yearToT(ev.startYear);
                    const endT = yearToT(ev.endYear ?? ev.startYear);
                    const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                    const w = Math.max(24, (endT - startT) * jsPixelsPerUnit);
                    if (x + w < 0 || x > canvasWidth) return null;
                    const trackIdx = trackMap?.get(ev.id) ?? 0;
                    const barY = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                    const barH = TRACK_HEIGHT - 8;
                    return (
                      <View
                        key={`hit-${ev.id}`}
                        onStartShouldSetResponder={() => {
                          handleTap(ev);
                          return false;
                        }}
                        style={{ position: 'absolute', left: x, top: barY, width: w, height: barH }}
                      />
                    );
                  }),
                  ...events.map((ev) => {
                    if (!labelVisibleIds.has(ev.id)) return null;
                    if (lblSize === 0) return null;
                    const startT = yearToT(ev.startYear);
                    const endT = yearToT(ev.endYear ?? ev.startYear);
                    const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                    const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                    if (x + w < 0 || x > canvasWidth) return null;
                    const trackIdx = trackMap?.get(ev.id) ?? 0;
                    const barY = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                    const barH = TRACK_HEIGHT - 8;
                    const labelTop = barY + barH / 2 - lblSize / 2;
                    return (
                      <View
                        key={`lbl-${ev.id}`}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: Math.max(x, 0) + 3,
                          top: labelTop,
                          maxWidth: Math.max(0, Math.min(x + w, canvasWidth) - Math.max(x, 0) - 6),
                        }}
                      >
                        <Text
                          style={{
                            ...typography.caption,
                            fontSize: lblSize,
                            color: colors.textPrimary,
                          }}
                          numberOfLines={1}
                        >
                          {ev.title}
                        </Text>
                      </View>
                    );
                  }),
                ];
              })}
            </View>
          </View>
        </GestureDetector>
      </View>
      <View style={styles.zoomButtons} pointerEvents="box-none">
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} accessibilityLabel="Zoom in">
          <Text style={styles.zoomBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} accessibilityLabel="Zoom out">
          <Text style={styles.zoomBtnText}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisRow: {
    flexDirection: 'row',
  },
  container: {
    flexDirection: 'row',
  },
  labels: {
    width: LANE_LABEL_WIDTH,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    justifyContent: 'center',
  },
  labelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  zoomButtons: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'column',
    gap: 6,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 36, 45, 0.90)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
