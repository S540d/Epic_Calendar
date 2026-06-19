import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, TouchableOpacity, Platform } from 'react-native';
import {
  GestureDetector,
  type ComposedGesture,
  type GestureType,
} from 'react-native-gesture-handler';
import { type SharedValue } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { EpochBand } from './EpochBand';
import { EpochChipBar } from './EpochChipBar';
import { TimeAxis } from './TimeAxis';
import { TimelineBreadcrumb } from './TimelineBreadcrumb';
import { TimelineMinimap } from './TimelineMinimap';
import { ZoomLevelIndicator } from './ZoomLevelIndicator';
import { dominantEpoch } from '@/timeline/epoch';
import { clampOffsetX } from '@/timeline/lod';
import { eventLabelFontSize, eventLabelMaxLines } from '@/timeline/lod';
import { yearToT, T_PRESENT as T_HEUTE } from '@/timeline/scale';
import { type TimelineEvent, type ZoomLevel } from '@/data/schema';
import {
  LANE_LABEL_WIDTH,
  LANE_PADDING_V,
  TRACK_HEIGHT,
  colors,
  eventColor,
  typography,
  type Category,
} from '@/theme/tokens';
import type { TrackMap } from '@/timeline/culling';
import {
  MAX_EVENTS_PER_LANE,
  MIN_HIT_PX,
  laneHeightForTracks,
  timelineStyles as styles,
} from './timelineRenderShared';

type Props = {
  lanes: Category[];
  laneTops: number[];
  laneTrackCounts: Map<Category, number>;
  visibleByLane: Map<Category, TimelineEvent[]>;
  tracksByLane: Map<Category, TrackMap>;
  overflowCounts: Map<Category, number>;
  labelVisibleIds: Set<string>;
  canvasWidth: number;
  canvasHeight: number;
  jsOffsetX: number;
  jsPixelsPerUnit: number;
  offsetX: SharedValue<number>;
  pixelsPerUnit: SharedValue<number>;
  gesture: GestureType | ComposedGesture;
  zoomLevel: ZoomLevel;
  zoomAtPoint: (focalX: number, factor: number) => void;
  onEventTap: (event: TimelineEvent) => void;
  zoomToFit: (startYear: number, endYear: number | null | undefined) => void;
  handleMinimapJump: (newOffsetX: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  jumpToToday: () => void;
  /** Whether the Erdzeitalter lane is active (epoch pill only meaningful then). */
  showEpochLabel: boolean;
  minimapHighlight?: { startT: number; endT: number } | null;
};

/**
 * Web timeline renderer. Renders event bars viewport-relatively inside a fixed-
 * width View (same model as the native Skia renderer). Pan is driven by RNGH
 * gestures; mouse wheel is handled via a useEffect shim.
 */
export function TimelineCanvasWeb({
  lanes,
  laneTops,
  laneTrackCounts,
  visibleByLane,
  tracksByLane,
  overflowCounts,
  labelVisibleIds,
  canvasWidth,
  canvasHeight,
  jsOffsetX,
  jsPixelsPerUnit,
  offsetX,
  pixelsPerUnit,
  gesture,
  zoomLevel,
  zoomAtPoint,
  onEventTap,
  zoomToFit,
  handleMinimapJump,
  zoomIn,
  zoomOut,
  jumpToToday,
  showEpochLabel,
  minimapHighlight,
}: Props) {
  const { t } = useTranslation();
  const WEB_PPU = jsPixelsPerUnit;

  // Viewport-relative coordinates (identity transform: t = year).
  const visibleStartYear = jsOffsetX;
  const visibleEndYear = jsOffsetX + canvasWidth / WEB_PPU;
  const centerYear = jsOffsetX + canvasWidth / (2 * WEB_PPU);
  const webEpochLabel = showEpochLabel ? (dominantEpoch(centerYear)?.title ?? null) : null;

  const heutePx = (T_HEUTE - jsOffsetX) * WEB_PPU;
  const heuteVisible = heutePx >= -1 && heutePx <= canvasWidth + 1;

  // Stable ref for the wheel handler. SharedValues are stable objects; only
  // WEB_PPU, canvasWidth and zoomAtPoint change between renders.
  const wheelStateRef = useRef({ offsetX, pixelsPerUnit, WEB_PPU, canvasWidth, zoomAtPoint });
  useLayoutEffect(() => {
    wheelStateRef.current.WEB_PPU = WEB_PPU;
    wheelStateRef.current.canvasWidth = canvasWidth;
    wheelStateRef.current.zoomAtPoint = zoomAtPoint;
  });

  const containerRef = useRef<View>(null);

  // Mouse-wheel shim: horizontal pan (wheel/trackpad) + ctrl/⌘+wheel zoom.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = containerRef.current as unknown as HTMLElement;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const {
        offsetX: oX,
        pixelsPerUnit: ppu,
        WEB_PPU: wpp,
        canvasWidth: cw,
        zoomAtPoint: zap,
      } = wheelStateRef.current;
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom emulation (browser reports ctrl+wheel for trackpad pinch).
        const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
        zap(e.offsetX, factor);
      } else {
        // Horizontal pan: prefer deltaX (trackpad swipe), fall back to deltaY (mouse wheel).
        const delta = Math.abs(e.deltaX) >= 1 ? e.deltaX : e.deltaY;
        oX.value = clampOffsetX(oX.value + delta / wpp, ppu.value, cw); // eslint-disable-line react-hooks/immutability
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      ref={containerRef}
      style={Platform.select({
        // Root does NOT scroll: header rows (axis/minimap/band) and the floating
        // zoom buttons stay fixed; only the lane area scrolls vertically.
        web: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } as any,
        default: { flex: 1 },
      })}
    >
      <View
        style={[
          styles.axisRow,
          Platform.select({ web: { position: 'sticky', top: 0, zIndex: 10 } as any }),
        ]}
      >
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <TimeAxis
          offsetX={jsOffsetX}
          pixelsPerUnit={WEB_PPU}
          canvasWidth={canvasWidth}
          zoomLevel={zoomLevel}
        />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ZoomLevelIndicator zoomLevel={zoomLevel} />
          <TimelineBreadcrumb
            startYear={visibleStartYear}
            endYear={visibleEndYear}
            epoch={webEpochLabel}
          />
        </View>
      </View>
      <TimelineMinimap
        offsetX={jsOffsetX}
        pixelsPerUnit={WEB_PPU}
        canvasWidth={canvasWidth}
        onJump={handleMinimapJump}
        highlightRange={minimapHighlight}
      />
      <View style={styles.epochBandRow}>
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <View style={{ width: canvasWidth, overflow: 'hidden' }}>
          <EpochBand
            offsetAtZero={jsOffsetX}
            pixelsPerUnit={WEB_PPU}
            width={canvasWidth}
            onJump={zoomToFit}
          />
        </View>
      </View>
      <EpochChipBar onJump={zoomToFit} />
      <View
        style={Platform.select({
          web: { flex: 1, overflowY: 'auto', overflowX: 'hidden' } as any,
          default: { flex: 1 },
        })}
      >
        <View style={[styles.container, { height: canvasHeight }]}>
          <View
            style={[
              styles.labels,
              Platform.select({ web: { position: 'sticky', left: 0, zIndex: 5 } as any }),
            ]}
          >
            {lanes.map((cat, idx) => {
              const overflow = overflowCounts.get(cat) ?? 0;
              const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
              return (
                <View
                  key={cat}
                  style={[
                    styles.label,
                    {
                      top: laneTops[idx],
                      height: laneH,
                      borderLeftColor: colors.category[cat],
                    },
                  ]}
                >
                  <View
                    style={{
                      width: laneH,
                      height: LANE_LABEL_WIDTH,
                      transform: [{ rotate: '-90deg' }],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={styles.labelText} numberOfLines={1}>
                      {t(`category.${cat}`)}
                    </Text>
                  </View>
                  {overflow > 0 && <Text style={styles.clusterBadge}>+{overflow}</Text>}
                </View>
              );
            })}
          </View>
          <GestureDetector gesture={gesture}>
            <View
              style={{
                width: canvasWidth,
                height: canvasHeight,
                overflow: 'hidden',
                backgroundColor: colors.bg,
              }}
            >
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                // Clip to MAX_EVENTS_PER_LANE; excess is shown as badge in lane label.
                const events = (visibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
                const trackMap = tracksByLane.get(cat);
                const lblSize = eventLabelFontSize(zoomLevel);
                const maxLines = eventLabelMaxLines(zoomLevel);
                return (
                  <View key={cat}>
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: laneTop,
                        width: canvasWidth,
                        height: laneH,
                        backgroundColor: colors.laneBg[cat],
                      }}
                    />
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      // Viewport-relative: bar at 0 = left edge of the visible area.
                      const x = (startT - jsOffsetX) * WEB_PPU;
                      const w = Math.max(2, (endT - startT) * WEB_PPU);
                      const trackIdx = trackMap?.get(ev.id) ?? 0;
                      const barTop = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                      const barHeight = TRACK_HEIGHT - 8;

                      // Label: show if selected by collision-aware pass, visible portion wide enough.
                      const showLabel = labelVisibleIds.has(ev.id) && lblSize > 0;
                      const visibleLeft = Math.max(x, 0);
                      const visibleRight = Math.min(x + w, canvasWidth);
                      const labelLeft = visibleLeft + 3;
                      const labelMaxW = Math.max(0, visibleRight - visibleLeft - 6);
                      const labelTopPos =
                        maxLines === 1 ? barTop + barHeight / 2 - lblSize / 2 : barTop + 4;

                      // Expand thin bars to >=44px touch target without changing visual width.
                      const hSlop = Math.max(0, (MIN_HIT_PX - w) / 2);
                      return (
                        <React.Fragment key={ev.id}>
                          <Pressable
                            onPress={() => onEventTap(ev)}
                            hitSlop={{ left: hSlop, right: hSlop, top: 4, bottom: 4 }}
                            accessibilityRole="button"
                            accessibilityLabel={ev.title}
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
                          {showLabel && labelMaxW > 4 && (
                            <View
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                left: labelLeft,
                                top: labelTopPos,
                                maxWidth: labelMaxW,
                              }}
                            >
                              <Text
                                numberOfLines={maxLines}
                                ellipsizeMode="tail"
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
              {heuteVisible && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: heutePx - 0.75,
                    top: 0,
                    width: 1.5,
                    height: canvasHeight,
                    backgroundColor: '#FF5050',
                  }}
                />
              )}
            </View>
          </GestureDetector>
        </View>
      </View>
      <View
        style={[
          styles.zoomButtons,
          Platform.select({ web: { position: 'absolute', right: 12, bottom: 12 } as any }),
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={jumpToToday}
          accessibilityLabel={t('axis.today')}
        >
          <Text style={styles.zoomBtnText}>⌖</Text>
        </TouchableOpacity>
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
