import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { EpochBand } from './EpochBand';
import { EpochChipBar } from './EpochChipBar';
import { TimeAxis } from './TimeAxis';
import { TimelineBreadcrumb } from './TimelineBreadcrumb';
import { TimelineMinimap } from './TimelineMinimap';
import { ZoomLevelIndicator } from './ZoomLevelIndicator';
import { dominantEpoch } from '@/timeline/epoch';
import { PRESENT_RIGHT_PAD_FRACTION } from '@/timeline/lod';
import { eventLabelFontSize, eventLabelMaxLines } from '@/timeline/lod';
import {
  tToYear,
  yearToT,
  T_MIN as TOTAL_T_MIN,
  T_MAX as TOTAL_T_MAX,
  T_PRESENT as T_HEUTE,
} from '@/timeline/scale';
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
  LABEL_MIN_BAR_PX,
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
  canvasWidth: number;
  canvasHeight: number;
  jsPixelsPerUnit: number;
  zoomLevel: ZoomLevel;
  webScrollX: number;
  commitScrollX: (x: number) => void;
  webScrollRef: React.RefObject<ScrollView>;
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
 * Web timeline renderer. Lays bars out absolutely inside a horizontal
 * ScrollView (no Skia canvas on web). Pure presentation — all viewport state
 * and commands come in via props from useTimelineViewport / TimelineView.
 */
export function TimelineCanvasWeb({
  lanes,
  laneTops,
  laneTrackCounts,
  visibleByLane,
  tracksByLane,
  overflowCounts,
  canvasWidth,
  canvasHeight,
  jsPixelsPerUnit,
  zoomLevel,
  webScrollX,
  commitScrollX,
  webScrollRef,
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
  // Extra right padding so "Heute" can be scrolled to the canvas center
  // (centering the recent past); this empty strip carries no axis labels.
  const webRightPad = canvasWidth * PRESENT_RIGHT_PAD_FRACTION;
  const webCanvasWidth = Math.ceil((TOTAL_T_MAX - TOTAL_T_MIN) * WEB_PPU + webRightPad);
  const webOffsetAtZero = TOTAL_T_MIN;
  const webOffsetX = webOffsetAtZero + webScrollX / WEB_PPU;

  const heuteWebX = (T_HEUTE - TOTAL_T_MIN) * WEB_PPU;
  const initWebScrollX = Math.max(0, heuteWebX - canvasWidth);

  const visibleStartYear = tToYear(webOffsetX);
  const visibleEndYear = tToYear(webOffsetX + canvasWidth / WEB_PPU);
  const webCenterYear = tToYear(webOffsetX + canvasWidth / (2 * WEB_PPU));
  const webEpochLabel = showEpochLabel ? (dominantEpoch(webCenterYear)?.title ?? null) : null;

  // Throttle: only re-render when the viewport moved enough to change which
  // events are visible (~6px). onScrollEndDrag/onMomentumScrollEnd always commit
  // the exact final position so the throttle ref never lags the real DOM scroll.
  const SCROLL_RERENDER_THRESHOLD = 6;
  const lastScrollXRef = React.useRef(webScrollX);
  const handleWebScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const x = e.nativeEvent.contentOffset.x;
    if (Math.abs(x - lastScrollXRef.current) < SCROLL_RERENDER_THRESHOLD) return;
    lastScrollXRef.current = x;
    commitScrollX(x);
  };
  const commitFinalScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    lastScrollXRef.current = e.nativeEvent.contentOffset.x;
    commitScrollX(e.nativeEvent.contentOffset.x);
  };

  return (
    <View
      style={Platform.select({
        // Root does NOT scroll: header rows (axis/minimap/band) and the floating
        // zoom buttons stay fixed; only the lane area scrolls vertically.
        // position:fixed children break inside a scrolling parent, which made the
        // zoom buttons invisible before.
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
          offsetX={webOffsetX}
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
        offsetX={webOffsetX}
        pixelsPerUnit={WEB_PPU}
        canvasWidth={canvasWidth}
        onJump={handleMinimapJump}
        highlightRange={minimapHighlight}
      />
      <View style={styles.epochBandRow}>
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <View style={{ width: canvasWidth, overflow: 'hidden' }}>
          <EpochBand
            offsetAtZero={webOffsetX}
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
              return (
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
                  {overflow > 0 && <Text style={styles.clusterBadge}>+{overflow}</Text>}
                </View>
              );
            })}
          </View>
          <ScrollView
            ref={webScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={Platform.select({
              web: { flex: 1, backgroundColor: colors.bg, overflowX: 'scroll' } as any,
              default: { flex: 1, backgroundColor: colors.bg },
            })}
            scrollEventThrottle={16}
            onScroll={handleWebScroll}
            onScrollEndDrag={commitFinalScroll}
            onMomentumScrollEnd={commitFinalScroll}
            contentOffset={{ x: initWebScrollX, y: 0 }}
          >
            <View style={{ width: webCanvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                // Clip to MAX_EVENTS_PER_LANE; excess is shown as badge in lane label.
                const events = (visibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
                const webTrackMap = tracksByLane.get(cat);
                const lblSize = eventLabelFontSize(zoomLevel);
                const maxLines = eventLabelMaxLines(zoomLevel);
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
                      const trackIdx = webTrackMap?.get(ev.id) ?? 0;
                      const barTop = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                      const barHeight = TRACK_HEIGHT - 8;
                      const stickyLabelLeft =
                        w >= LABEL_MIN_BAR_PX ? Math.max(x + 3, webScrollX + 3) : null;
                      const stickyLabelMaxW =
                        stickyLabelLeft !== null ? Math.max(0, x + w - stickyLabelLeft - 3) : 0;
                      const labelTopPos =
                        maxLines === 1 ? barTop + barHeight / 2 - lblSize / 2 : barTop + 4;
                      // Expand thin bars to a >=44px touch target via hitSlop,
                      // without changing the visual bar width.
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
                          {stickyLabelLeft !== null && stickyLabelMaxW > 4 && lblSize > 0 && (
                            <View
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                left: stickyLabelLeft,
                                top: labelTopPos,
                                maxWidth: stickyLabelMaxW,
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
