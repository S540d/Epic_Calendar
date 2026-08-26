import React, { forwardRef } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import {
  GestureDetector,
  type ComposedGesture,
  type GestureType,
} from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { TimelineChrome } from './TimelineChrome';
import { TimelineLaneLabels } from './TimelineLaneLabels';
import { eventLabelFontSize, eventLabelMaxLines } from '@/timeline/lod';
import { yearToT } from '@/timeline/scale';
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
import type { LineageConnector, TrackMap } from '@/timeline/culling';
import {
  LABEL_MAX_WIDTH,
  LABEL_MIN_BAR_PX,
  MAX_EVENTS_PER_LANE,
  POPOVER_MAX_HEIGHT,
  POPOVER_MAX_WIDTH,
  laneHeightForTracks,
  timelineStyles as styles,
} from './timelineRenderShared';

// Skia is native-only.
let Canvas: any = null;
let Group: any = null;
let Rect: any = null;
let Paint: any = null;
if (Platform.OS !== 'web') {
  try {
    const skia = require('@shopify/react-native-skia');
    Canvas = skia.Canvas;
    Group = skia.Group;
    Rect = skia.Rect;
    Paint = skia.Paint;
  } catch {
    // Skia not available
  }
}

export type PopoverState = { events: TimelineEvent[]; x: number; y: number };

type Props = {
  lanes: Category[];
  laneTops: number[];
  laneTrackCounts: Map<Category, number>;
  visibleByLane: Map<Category, TimelineEvent[]>;
  tracksByLane: Map<Category, TrackMap>;
  connectorsByLane: Map<Category, LineageConnector[]>;
  overflowCounts: Map<Category, number>;
  labelVisibleIds: Set<string>;
  canvasWidth: number;
  canvasHeight: number;
  jsOffsetX: number;
  jsPixelsPerUnit: number;
  zoomLevel: ZoomLevel;
  viewportRange: { startYear: number; endYear: number };
  heutePx: number;
  heuteVisible: boolean;
  gesture: ComposedGesture | GestureType;
  zoomToFit: (startYear: number, endYear: number | null | undefined) => void;
  handleMinimapJump: (newOffsetX: number) => void;
  popoverState: PopoverState | null;
  onPopoverClose: () => void;
  onPopoverSelect: (event: TimelineEvent) => void;
  minimapHighlight?: { startT: number; endT: number } | null;
  /** Shows the live FPS overlay (#5 FPS-Monitoring, opt-in via Settings). */
  showFpsMonitor?: boolean;
};

/**
 * Native timeline renderer: Skia canvas for the bars + an absolutely-positioned
 * label overlay + the multi-hit disambiguation popover. Pure presentation — the
 * gesture and all viewport commands come in via props.
 */
export const TimelineCanvasNative = forwardRef<View, Props>(function TimelineCanvasNative(
  {
    lanes,
    laneTops,
    laneTrackCounts,
    visibleByLane,
    tracksByLane,
    connectorsByLane,
    overflowCounts,
    labelVisibleIds,
    canvasWidth,
    canvasHeight,
    jsOffsetX,
    jsPixelsPerUnit,
    zoomLevel,
    viewportRange,
    heutePx,
    heuteVisible,
    gesture,
    zoomToFit,
    handleMinimapJump,
    popoverState,
    onPopoverClose,
    onPopoverSelect,
    minimapHighlight,
    showFpsMonitor = false,
  }: Props,
  lanesContainerRef,
) {
  const { t } = useTranslation();

  return (
    <View>
      <TimelineChrome
        jsOffsetX={jsOffsetX}
        jsPixelsPerUnit={jsPixelsPerUnit}
        canvasWidth={canvasWidth}
        zoomLevel={zoomLevel}
        viewportRange={viewportRange}
        zoomToFit={zoomToFit}
        handleMinimapJump={handleMinimapJump}
        minimapHighlight={minimapHighlight}
        showFpsMonitor={showFpsMonitor}
      />

      {/* Ref forwarded out so `TimelineView` can `measureLayout` this lane
          container relative to the *outer* screen ScrollView (native has no
          internal scroll like web's `overflowY:auto` — the whole tree here
          sits inside `TimelineScreen`'s ScrollView) and scroll a lane into
          view (`scrollToEventLane`, #171-Lernreise follow-up). */}
      <View ref={lanesContainerRef} style={[styles.container, { height: canvasHeight }]}>
        <TimelineLaneLabels
          lanes={lanes}
          laneTops={laneTops}
          laneTrackCounts={laneTrackCounts}
          overflowCounts={overflowCounts}
        />

        <GestureDetector gesture={gesture}>
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                // Clip to MAX_EVENTS_PER_LANE; excess is shown as badge in lane label.
                const events = (visibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
                const trackMap = tracksByLane.get(cat);
                const connectors = connectorsByLane.get(cat) ?? [];
                return (
                  <Group key={cat}>
                    <Rect
                      x={0}
                      y={laneTop}
                      width={canvasWidth}
                      height={laneH}
                      color={colors.laneBg[cat]}
                    />
                    {/* Lineage continuation lines — drawn under the bars. */}
                    {connectors.map((c, ci) => {
                      const x1 = (yearToT(c.fromYear) - jsOffsetX) * jsPixelsPerUnit;
                      const x2 = (yearToT(c.toYear) - jsOffsetX) * jsPixelsPerUnit;
                      if (x2 < 0 || x1 > canvasWidth) return null;
                      const barY = laneTop + LANE_PADDING_V + c.track * TRACK_HEIGHT + 4;
                      const cy = barY + (TRACK_HEIGHT - 8) / 2 - 1;
                      return (
                        <Rect
                          key={`conn-${cat}-${ci}`}
                          x={x1}
                          y={cy}
                          width={Math.max(1, x2 - x1)}
                          height={2}
                          color={eventColor({ category: cat, culture: c.culture, color: c.color })}
                          opacity={0.45}
                        />
                      );
                    })}
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                      const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                      const trackIdx = trackMap?.get(ev.id) ?? 0;
                      const barY = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                      const barH = TRACK_HEIGHT - 8;
                      return (
                        <React.Fragment key={ev.id}>
                          <Rect x={x} y={barY} width={w} height={barH} color={eventColor(ev)} />
                          {ev.continent === 'global' && Paint && (
                            <Rect x={x} y={barY} width={w} height={barH}>
                              <Paint
                                style="stroke"
                                color="rgba(255,255,255,0.30)"
                                strokeWidth={1}
                              />
                            </Rect>
                          )}
                        </React.Fragment>
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

            {/* Labels only; taps are handled by the GestureDetector hit-test. */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                // Cap to match the Skia bar-drawing loop so labels only appear over real bars.
                const events = (visibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
                const trackMap = tracksByLane.get(cat);
                const lblSize = eventLabelFontSize(zoomLevel);
                const maxLines = eventLabelMaxLines(zoomLevel);
                return [
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
                    const labelTop = maxLines === 1 ? barY + barH / 2 - lblSize / 2 : barY + 4;
                    // Point events render as a fixed-width dot (w=2) — give the
                    // label a virtual slot to its right instead of clamping to 0.
                    const labelSlotW = w < LABEL_MIN_BAR_PX ? LABEL_MAX_WIDTH : w;
                    return (
                      <View
                        key={`lbl-${ev.id}`}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: Math.max(x, 0) + 3,
                          top: labelTop,
                          maxWidth: Math.max(
                            0,
                            Math.min(x + labelSlotW, canvasWidth) - Math.max(x, 0) - 6,
                          ),
                        }}
                      >
                        <Text
                          style={{
                            ...typography.caption,
                            fontSize: lblSize,
                            color: colors.textPrimary,
                          }}
                          numberOfLines={maxLines}
                          ellipsizeMode="tail"
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

      {popoverState && (
        <>
          {/* Transparent backdrop — tap outside closes the popover */}
          <Pressable style={StyleSheet.absoluteFill} onPress={onPopoverClose} accessible={false} />
          <View
            style={[
              styles.popover,
              {
                // px is in canvas coords; add LANE_LABEL_WIDTH to convert to
                // screen coords, then clamp to [0, right edge - popover width].
                left: Math.max(
                  0,
                  Math.min(
                    popoverState.x + LANE_LABEL_WIDTH,
                    canvasWidth + LANE_LABEL_WIDTH - POPOVER_MAX_WIDTH,
                  ),
                ),
                // Clamp vertically so the popover stays inside the canvas area.
                top: Math.max(0, Math.min(popoverState.y - 8, canvasHeight - POPOVER_MAX_HEIGHT)),
              },
            ]}
          >
            <Text style={styles.popoverTitle}>{t('popover.title')}</Text>
            {popoverState.events.map((ev) => (
              <Pressable
                key={ev.id}
                style={styles.popoverItem}
                onPress={() => onPopoverSelect(ev)}
                accessibilityRole="button"
                accessibilityLabel={ev.title}
              >
                <View style={[styles.popoverDot, { backgroundColor: eventColor(ev) }]} />
                <Text style={styles.popoverText} numberOfLines={1}>
                  {ev.title}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.popoverDismiss}
              onPress={onPopoverClose}
              accessibilityLabel={t('popover.dismiss')}
            >
              <Text style={styles.popoverDismissText}>✕</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
});
