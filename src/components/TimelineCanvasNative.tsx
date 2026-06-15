import React from 'react';
import { StyleSheet, View, Text, Pressable, TouchableOpacity, Platform } from 'react-native';
import {
  GestureDetector,
  type ComposedGesture,
  type GestureType,
} from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { EpochBand } from './EpochBand';
import { TimeAxis } from './TimeAxis';
import { TimelineBreadcrumb } from './TimelineBreadcrumb';
import { TimelineMinimap } from './TimelineMinimap';
import { ZoomLevelIndicator } from './ZoomLevelIndicator';
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
import type { TrackMap } from '@/timeline/culling';
import {
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

export type PopoverState = { events: TimelineEvent[]; x: number; y: number };

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
  zoomLevel: ZoomLevel;
  viewportRange: { startYear: number; endYear: number };
  epochLabel: string | null;
  heutePx: number;
  heuteVisible: boolean;
  gesture: ComposedGesture | GestureType;
  zoomToFit: (startYear: number, endYear: number | null | undefined) => void;
  handleMinimapJump: (newOffsetX: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  jumpToToday: () => void;
  popoverState: PopoverState | null;
  onPopoverClose: () => void;
  onPopoverSelect: (event: TimelineEvent) => void;
};

/**
 * Native timeline renderer: Skia canvas for the bars + an absolutely-positioned
 * label overlay + the multi-hit disambiguation popover. Pure presentation — the
 * gesture and all viewport commands come in via props.
 */
export function TimelineCanvasNative({
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
  zoomLevel,
  viewportRange,
  epochLabel,
  heutePx,
  heuteVisible,
  gesture,
  zoomToFit,
  handleMinimapJump,
  zoomIn,
  zoomOut,
  jumpToToday,
  popoverState,
  onPopoverClose,
  onPopoverSelect,
}: Props) {
  const { t } = useTranslation();

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
          <ZoomLevelIndicator zoomLevel={zoomLevel} />
          <TimelineBreadcrumb
            startYear={viewportRange.startYear}
            endYear={viewportRange.endYear}
            epoch={epochLabel}
          />
        </View>
      </View>

      <TimelineMinimap
        offsetX={jsOffsetX}
        pixelsPerUnit={jsPixelsPerUnit}
        canvasWidth={canvasWidth}
        onJump={handleMinimapJump}
      />
      <View style={styles.epochBandRow}>
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <View style={{ width: canvasWidth, overflow: 'hidden' }}>
          <EpochBand
            offsetAtZero={jsOffsetX}
            pixelsPerUnit={jsPixelsPerUnit}
            width={canvasWidth}
            onJump={zoomToFit}
          />
        </View>
      </View>

      <View style={[styles.container, { height: canvasHeight }]}>
        <View style={styles.labels}>
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

        <GestureDetector gesture={gesture}>
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                // Clip to MAX_EVENTS_PER_LANE; excess is shown as badge in lane label.
                const events = (visibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
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
      <View style={styles.zoomButtons} pointerEvents="box-none">
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
}
