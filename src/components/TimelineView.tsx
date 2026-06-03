import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, Platform, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedReaction, runOnJS, withTiming } from 'react-native-reanimated';

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
import { ALL_EVENTS } from '@/data/events';
import { filterVisible } from '@/timeline/culling';
import { clampPixelsPerUnit, humanHistoryViewState, pixelsPerUnitToZoomLevel } from '@/timeline/lod';
import { viewportYearRange, yearToT, tToYear } from '@/timeline/scale';
import {
  CATEGORY_LABELS,
  type Continent,
  type TimelineEvent,
  type ZoomLevel,
} from '@/data/schema';
import {
  LANE_GAP,
  LANE_HEIGHT,
  LANE_LABEL_WIDTH,
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

// Full t-range constants used for the web canvas layout
const TOTAL_T_MIN = yearToT(-13_800_000_000);
const TOTAL_T_MAX = yearToT(2100);
const T_HEUTE = yearToT(2026);

const LABEL_MIN_BAR_PX = 32;
const LABEL_MAX_WIDTH = 80;

/** Collision-aware label visibility: hide labels that would overlap. Largest bars win. */
function computeLabelVisibleIds(
  visibleByLane: Map<Category, TimelineEvent[]>,
  jsOffsetX: number,
  jsPixelsPerUnit: number,
): Set<string> {
  const result = new Set<string>();
  for (const events of visibleByLane.values()) {
    const placed: Array<{ l: number; r: number }> = [];
    const sorted = [...events].sort((a, b) => {
      const wa = (yearToT(a.endYear ?? a.startYear) - yearToT(a.startYear)) * jsPixelsPerUnit;
      const wb = (yearToT(b.endYear ?? b.startYear) - yearToT(b.startYear)) * jsPixelsPerUnit;
      return wb - wa;
    });
    for (const ev of sorted) {
      const x = (yearToT(ev.startYear) - jsOffsetX) * jsPixelsPerUnit;
      const w = Math.max(0, (yearToT(ev.endYear ?? ev.startYear) - yearToT(ev.startYear)) * jsPixelsPerUnit);
      if (w < LABEL_MIN_BAR_PX) continue;
      const lx = x + 3;
      const rx = lx + Math.min(LABEL_MAX_WIDTH, w - 6);
      if (placed.some((p) => lx < p.r && rx > p.l)) continue;
      placed.push({ l: lx, r: rx });
      result.add(ev.id);
    }
  }
  return result;
}

export function TimelineView({ activeCategories, continent, onSelectEvent, resetKey = 0 }: Props) {
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
  useLayoutEffect(() => { canvasWidthRef.current = canvasWidth; });

  // Animate to default view whenever resetKey increments (0 = initial mount, skip)
  useEffect(() => {
    if (resetKey === 0) return;
    const cw = canvasWidthRef.current;
    if (!cw) return;
    if (Platform.OS === 'web') {
      // Web view is driven by ScrollView — scroll programmatically so Heute lands at right edge
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

  const labelVisibleIds = useMemo(
    () => (zoomLevel >= 2 ? computeLabelVisibleIds(visibleByLane, jsOffsetX, jsPixelsPerUnit) : new Set<string>()),
    [visibleByLane, jsOffsetX, jsPixelsPerUnit, zoomLevel],
  );

  // Pixel position of "Heute" in the canvas coordinate space
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
      offsetX.value = startOffsetX.value - e.translationX / pixelsPerUnit.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      startPixelsPerUnit.value = pixelsPerUnit.value;
      startFocalT.value = offsetX.value + e.focalX / pixelsPerUnit.value;
    })
    .onUpdate((e) => {
      const next = clampPixelsPerUnit(startPixelsPerUnit.value * e.scale);
      pixelsPerUnit.value = next;
      offsetX.value = startFocalT.value - e.focalX / next;
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const canvasHeight = Math.max(
    lanes.length * LANE_HEIGHT + Math.max(0, lanes.length - 1) * LANE_GAP,
    80,
  );

  const handleTap = (event: TimelineEvent) => onSelectEvent(event);

  // ─── Web fallback ─────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    const WEB_PPU = jsPixelsPerUnit;
    const webCanvasWidth = Math.ceil((TOTAL_T_MAX - TOTAL_T_MIN) * WEB_PPU);
    const webOffsetAtZero = TOTAL_T_MIN;
    const webOffsetX = webOffsetAtZero + webScrollX / WEB_PPU;

    // Initial scroll: "Heute" at the right edge of the viewport
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
      <View>
        <View style={styles.axisRow}>
          <View style={{ width: LANE_LABEL_WIDTH }} />
          <TimeAxis
            offsetX={webOffsetX}
            pixelsPerUnit={WEB_PPU}
            canvasWidth={canvasWidth}
            zoomLevel={zoomLevel}
          />
        </View>
        <View style={styles.container}>
          <View style={styles.labels}>
            {lanes.map((cat, idx) => (
              <View
                key={cat}
                style={[
                  styles.label,
                  { top: idx * (LANE_HEIGHT + LANE_GAP), height: LANE_HEIGHT, borderLeftColor: colors.category[cat] },
                ]}
              >
                <Text style={styles.labelText}>{CATEGORY_LABELS[cat]}</Text>
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
                const top = idx * (LANE_HEIGHT + LANE_GAP);
                const events = webVisibleByLane.get(cat) ?? [];
                return (
                  <View key={cat}>
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top,
                        width: webCanvasWidth,
                        height: LANE_HEIGHT,
                        backgroundColor: colors.laneBg[cat],
                      }}
                    />
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      const x = (startT - webOffsetAtZero) * WEB_PPU;
                      const w = Math.max(2, (endT - startT) * WEB_PPU);
                      return (
                        <View
                          key={ev.id}
                          onStartShouldSetResponder={() => { handleTap(ev); return false; }}
                          style={{
                            position: 'absolute',
                            left: x,
                            top: top + 18,
                            width: w,
                            height: LANE_HEIGHT - 36,
                            backgroundColor: eventColor(ev),
                            borderRadius: 2,
                          }}
                        />
                      );
                    })}
                  </View>
                );
              })}
              {/* Heute line */}
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
      </View>
    );
  }

  // ─── Native (Skia) ────────────────────────────────────────────────────────
  return (
    <View>
      {/* Axis row: spacer aligns with lane-label column */}
      <View style={styles.axisRow}>
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <TimeAxis
          offsetX={jsOffsetX}
          pixelsPerUnit={jsPixelsPerUnit}
          canvasWidth={canvasWidth}
          zoomLevel={zoomLevel}
        />
      </View>

      <View style={styles.container}>
        <View style={styles.labels}>
          {lanes.map((cat, idx) => (
            <View
              key={cat}
              style={[
                styles.label,
                { top: idx * (LANE_HEIGHT + LANE_GAP), height: LANE_HEIGHT, borderLeftColor: colors.category[cat] },
              ]}
            >
              <Text style={styles.labelText}>{CATEGORY_LABELS[cat]}</Text>
            </View>
          ))}
        </View>

        <GestureDetector gesture={gesture}>
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const top = idx * (LANE_HEIGHT + LANE_GAP);
                const events = visibleByLane.get(cat) ?? [];
                return (
                  <Group key={cat}>
                    <Rect x={0} y={top} width={canvasWidth} height={LANE_HEIGHT} color={colors.laneBg[cat]} />
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                      const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                      return (
                        <Rect
                          key={ev.id}
                          x={x}
                          y={top + 18}
                          width={w}
                          height={LANE_HEIGHT - 36}
                          color={eventColor(ev)}
                        />
                      );
                    })}
                  </Group>
                );
              })}
              {/* Heute line — rendered last so it draws on top */}
              {heuteVisible && (
                <Rect x={heutePx - 0.75} y={0} width={1.5} height={canvasHeight} color="rgba(255, 80, 80, 0.9)" />
              )}
            </Canvas>

            {/* Transparent layer: tap hit areas + event labels */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {lanes.map((cat, idx) => {
                const top = idx * (LANE_HEIGHT + LANE_GAP);
                const events = visibleByLane.get(cat) ?? [];
                return [
                  // Hit areas (always rendered)
                  ...events.map((ev) => {
                    const startT = yearToT(ev.startYear);
                    const endT = yearToT(ev.endYear ?? ev.startYear);
                    const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                    const w = Math.max(24, (endT - startT) * jsPixelsPerUnit);
                    if (x + w < 0 || x > canvasWidth) return null;
                    return (
                      <View
                        key={`hit-${ev.id}`}
                        onStartShouldSetResponder={() => { handleTap(ev); return false; }}
                        style={{ position: 'absolute', left: x, top: top + 18, width: w, height: LANE_HEIGHT - 36 }}
                      />
                    );
                  }),
                  // Labels (LOD 2+, collision-filtered)
                  ...events.map((ev) => {
                    if (!labelVisibleIds.has(ev.id)) return null;
                    const startT = yearToT(ev.startYear);
                    const endT = yearToT(ev.endYear ?? ev.startYear);
                    const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                    const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                    if (x + w < 0 || x > canvasWidth) return null;
                    return (
                      <View
                        key={`lbl-${ev.id}`}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: x + 3,
                          top: top + 3,
                          maxWidth: Math.max(0, w - 6),
                        }}
                      >
                        <Text
                          style={{ ...typography.caption, fontSize: 9, color: colors.textPrimary }}
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
});
