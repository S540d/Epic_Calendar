import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { clampOffsetX } from '@/timeline/lod';
import { contextRangeForViewport, type ContextRange } from '@/timeline/contextRange';
import { tToYear, yearToT } from '@/timeline/scale';
import { colors, LANE_LABEL_WIDTH, spacing, typography } from '@/theme/tokens';

type Props = {
  /** Left edge of the current viewport in T units (from offsetX shared value, JS copy). */
  offsetX: number;
  pixelsPerUnit: number;
  canvasWidth: number;
  /**
   * Called when the user taps or drags the minimap; receives the new offsetX.
   * `animate` is false while scrubbing so the viewport follows the finger.
   */
  onJump: (newOffsetX: number, animate?: boolean) => void;
  /** Tapping a crumb of the context path zooms to that epoch. */
  onZoomTo?: (startYear: number, endYear: number) => void;
  /** When set, a pulsing highlight is shown at this T-unit range on the minimap. */
  highlightRange?: { startT: number; endT: number } | null;
};

export const MINIMAP_HEIGHT = 22;
/** Fraction of the context window per a11y increment/decrement. */
const A11Y_STEP = 0.1;
const MIN_BOX_WIDTH = 12;
const MIN_LABEL_SEGMENT_WIDTH = 44;
/** Only the deepest levels of the path fit next to the strip on a phone. */
const MAX_CRUMBS = 2;
// useNativeDriver is not supported by react-native-web; must be false on web.
const PULSE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Overview strip ("overview + detail"): a second, coarser timeline above the
 * lanes whose box marks the section the main timeline currently shows.
 *
 * It no longer spans the whole 5-billion-year timeline — on the linear scale
 * that shrank every historical viewport to a 4px stub (see
 * `contextRangeForViewport`). It shows an adaptive context window around the
 * viewport instead, painted with the epoch colours, plus the window's epoch
 * path (deepest two levels) as tappable crumbs on the left (which replaced `EpochBand`'s former
 * ancestor chip).
 *
 * Tap outside the box centres the viewport there; press-and-drag (on or off
 * the box) scrubs. The window is frozen for the duration of a drag — it would
 * otherwise re-snap under the finger as the viewport moves.
 */
export function TimelineMinimap({
  offsetX,
  pixelsPerUnit,
  canvasWidth,
  onJump,
  onZoomTo,
  highlightRange,
}: Props) {
  const { t } = useTranslation();
  const [barWidth, setBarWidth] = useState(0);

  const tSpan = pixelsPerUnit > 0 ? canvasWidth / pixelsPerUnit : 0;
  const liveRange = useMemo(
    () => contextRangeForViewport(tToYear(offsetX), tToYear(offsetX + tSpan)),
    [offsetX, tSpan],
  );
  const [frozenRange, setFrozenRange] = useState<ContextRange | null>(null);
  const range = frozenRange ?? liveRange;
  const rangeSpan = range.endYear - range.startYear;

  // Year distance between the grab point and the viewport centre, kept for
  // the whole drag so the box doesn't jump to centre on the finger.
  const grabRef = useRef<{ range: ContextRange; grabOffset: number } | null>(null);

  const [pulseAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!highlightRange) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }
    pulseAnim.setValue(0.8);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 150,
          useNativeDriver: PULSE_NATIVE_DRIVER,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: PULSE_NATIVE_DRIVER,
        }),
      ]),
      { iterations: 3 },
    ).start(() => pulseAnim.setValue(0));
  }, [highlightRange, pulseAnim]);

  const jumpToCenter = useCallback(
    (centerYear: number, animate: boolean) => {
      onJump(clampOffsetX(yearToT(centerYear) - tSpan / 2, pixelsPerUnit, canvasWidth), animate);
    },
    [onJump, tSpan, pixelsPerUnit, canvasWidth],
  );

  const yearAt = useCallback(
    (r: ContextRange, locationX: number) => {
      const fraction = Math.max(0, Math.min(1, locationX / barWidth));
      return r.startYear + fraction * (r.endYear - r.startYear);
    },
    [barWidth],
  );

  const handleGrant = useCallback(
    (e: GestureResponderEvent) => {
      if (!barWidth || !pixelsPerUnit) return;
      const r = liveRange;
      const year = yearAt(r, e.nativeEvent.locationX);
      const viewStart = tToYear(offsetX);
      const viewEnd = tToYear(offsetX + tSpan);
      let grabOffset = 0;
      if (year >= viewStart && year <= viewEnd) {
        grabOffset = year - (viewStart + viewEnd) / 2;
      } else {
        jumpToCenter(year, true);
      }
      grabRef.current = { range: r, grabOffset };
      setFrozenRange(r);
    },
    [barWidth, pixelsPerUnit, liveRange, yearAt, offsetX, tSpan, jumpToCenter],
  );

  const handleMove = useCallback(
    (e: GestureResponderEvent) => {
      const grab = grabRef.current;
      if (!grab || !barWidth) return;
      jumpToCenter(yearAt(grab.range, e.nativeEvent.locationX) - grab.grabOffset, false);
    },
    [barWidth, yearAt, jumpToCenter],
  );

  const handleRelease = useCallback(() => {
    grabRef.current = null;
    setFrozenRange(null);
  }, []);

  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (!pixelsPerUnit || !canvasWidth) return;
      const center = tToYear(offsetX + tSpan / 2);
      const step = A11Y_STEP * rangeSpan;
      if (event.nativeEvent.actionName === 'increment') jumpToCenter(center + step, true);
      else if (event.nativeEvent.actionName === 'decrement') jumpToCenter(center - step, true);
    },
    [pixelsPerUnit, canvasWidth, offsetX, tSpan, rangeSpan, jumpToCenter],
  );

  if (!pixelsPerUnit || !canvasWidth) return null;

  const crumbs = range.path.slice(-MAX_CRUMBS);
  const toX = (year: number) => ((year - range.startYear) / rangeSpan) * barWidth;
  const viewStartYear = tToYear(offsetX);
  const viewEndYear = tToYear(offsetX + tSpan);
  const boxRawLeft = toX(viewStartYear);
  const boxRawWidth = toX(viewEndYear) - boxRawLeft;
  const boxWidth = Math.min(barWidth, Math.max(MIN_BOX_WIDTH, boxRawWidth));
  // Keep a minimum-width box centred on the real viewport, inside the track.
  const boxLeft = Math.max(
    0,
    Math.min(barWidth - boxWidth, boxRawLeft + boxRawWidth / 2 - boxWidth / 2),
  );
  const centerFraction = (viewStartYear + viewEndYear) / 2 - range.startYear;

  const highlight =
    highlightRange &&
    tToYear(highlightRange.endT) >= range.startYear &&
    tToYear(highlightRange.startT) <= range.endYear
      ? {
          left: Math.max(0, toX(tToYear(highlightRange.startT))),
          width: Math.max(
            4,
            Math.min(barWidth, toX(tToYear(highlightRange.endT))) -
              Math.max(0, toX(tToYear(highlightRange.startT))),
          ),
        }
      : null;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: LANE_LABEL_WIDTH }} />
      {crumbs.length > 0 && (
        // Sibling of the track (not a child), so crumb taps never start a scrub.
        <View style={styles.crumbsRow}>
          {crumbs.map((epoch, i) => (
            <Pressable
              key={epoch.key}
              onPress={() => onZoomTo?.(epoch.startYear, epoch.endYear)}
              accessibilityRole="button"
              accessibilityLabel={t(`epochNav.${epoch.key}`)}
              accessibilityHint={t('epochNav.jumpHint')}
              style={({ pressed }) => [styles.crumb, pressed && styles.crumbPressed]}
            >
              <Text style={styles.crumbText} numberOfLines={1}>
                {t(`epochNav.${epoch.key}`)}
                {i < crumbs.length - 1 ? ' ›' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.trackWrapper}>
        <View
          style={styles.track}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={handleGrant}
          onResponderMove={handleMove}
          onResponderRelease={handleRelease}
          onResponderTerminate={handleRelease}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t('minimap.label')}
          accessibilityHint={t('minimap.hint')}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(Math.max(0, Math.min(1, centerFraction / rangeSpan)) * 100),
          }}
          accessibilityActions={[
            { name: 'increment', label: t('minimap.scrollForward') },
            { name: 'decrement', label: t('minimap.scrollBack') },
          ]}
          onAccessibilityAction={handleAccessibilityAction}
        >
          {barWidth > 0 &&
            range.segments.map((ep) => {
              const left = Math.max(0, toX(ep.startYear));
              const right = Math.min(barWidth, toX(ep.endYear));
              if (right <= left) return null;
              return (
                <View
                  key={ep.key}
                  pointerEvents="none"
                  style={[
                    styles.segment,
                    { left, width: right - left, backgroundColor: ep.color + '38' },
                  ]}
                >
                  {right - left >= MIN_LABEL_SEGMENT_WIDTH && (
                    <Text style={styles.segmentLabel} numberOfLines={1}>
                      {t(`epochNav.${ep.key}`)}
                    </Text>
                  )}
                </View>
              );
            })}
          {barWidth > 0 && (
            <View
              pointerEvents="none"
              testID="minimap-viewport-box"
              style={[styles.box, { left: boxLeft, width: boxWidth }]}
            />
          )}
          {barWidth > 0 && highlight && (
            <Animated.View
              pointerEvents="none"
              style={[styles.highlight, { ...highlight, opacity: pulseAnim }]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lives inside the same sticky wrapper as the axis row (see TimelineChrome),
  // so it never separates from the axis on scroll.
  wrapper: {
    flexDirection: 'row',
    paddingVertical: 3,
    backgroundColor: colors.bg,
  },
  trackWrapper: {
    flex: 1,
    marginHorizontal: spacing.xs,
    position: 'relative',
  },
  track: {
    height: MINIMAP_HEIGHT,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer' as any,
  },
  segment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: colors.bg,
    overflow: 'hidden',
  },
  segmentLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textSecondary,
  },
  box: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accent + '33',
    borderRadius: 4,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  crumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '40%',
    height: MINIMAP_HEIGHT,
    marginLeft: spacing.xs,
    overflow: 'hidden',
  },
  crumb: {
    paddingHorizontal: 3,
    flexShrink: 1,
  },
  crumbPressed: {
    opacity: 0.6,
  },
  crumbText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
