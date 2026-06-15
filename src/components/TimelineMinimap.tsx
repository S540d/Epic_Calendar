import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { clampOffsetX, T_MIN, T_MAX, FULL_T_SPAN } from '@/timeline/lod';
import { colors, LANE_LABEL_WIDTH, spacing } from '@/theme/tokens';

type Props = {
  /** Left edge of the current viewport in T units (from offsetX shared value, JS copy). */
  offsetX: number;
  pixelsPerUnit: number;
  canvasWidth: number;
  /** Called when the user taps the minimap; receives the new offsetX to jump to. */
  onJump: (newOffsetX: number) => void;
  /** When set, a pulsing highlight is shown at this T-unit range on the minimap. */
  highlightRange?: { startT: number; endT: number } | null;
};

const A11Y_STEP = 0.1;

export function TimelineMinimap({
  offsetX,
  pixelsPerUnit,
  canvasWidth,
  onJump,
  highlightRange,
}: Props) {
  const { t } = useTranslation();
  const [barWidth, setBarWidth] = useState(0);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!highlightRange) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }
    pulseAnim.setValue(0.8);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    ).start(() => pulseAnim.setValue(0));
  }, [highlightRange, pulseAnim]);

  const handlePress = useCallback(
    (e: { nativeEvent: { locationX: number } }) => {
      if (!barWidth || !pixelsPerUnit) return;
      const tSpan = canvasWidth / pixelsPerUnit;
      const fraction = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth));
      const tAtTap = T_MIN + fraction * FULL_T_SPAN;
      onJump(clampOffsetX(tAtTap - tSpan / 2, pixelsPerUnit, canvasWidth));
    },
    [barWidth, pixelsPerUnit, canvasWidth, onJump],
  );

  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (!pixelsPerUnit || !canvasWidth) return;
      const tSpan = canvasWidth / pixelsPerUnit;
      const currentFraction = Math.max(0, Math.min(1, (offsetX - T_MIN) / FULL_T_SPAN));
      let newFraction: number;
      if (event.nativeEvent.actionName === 'increment') {
        newFraction = Math.min(1, currentFraction + A11Y_STEP);
      } else if (event.nativeEvent.actionName === 'decrement') {
        newFraction = Math.max(0, currentFraction - A11Y_STEP);
      } else {
        return;
      }
      const tAtNew = T_MIN + newFraction * FULL_T_SPAN;
      onJump(clampOffsetX(tAtNew - tSpan / 2, pixelsPerUnit, canvasWidth));
    },
    [pixelsPerUnit, canvasWidth, offsetX, onJump],
  );

  if (!pixelsPerUnit || !canvasWidth) return null;
  const tSpan = canvasWidth / pixelsPerUnit;
  const indicatorFraction = (offsetX - T_MIN) / FULL_T_SPAN;
  const indicatorLeft = Math.max(0, Math.min(indicatorFraction * barWidth, barWidth - 4));
  const indicatorRawWidth = (tSpan / FULL_T_SPAN) * barWidth;
  // Minimum 4px so the indicator is always visible even at very high zoom levels.
  const indicatorWidth = Math.max(4, Math.min(indicatorRawWidth, barWidth - indicatorLeft));

  return (
    <View style={styles.wrapper}>
      <View style={{ width: LANE_LABEL_WIDTH }} />
      <Pressable
        style={styles.track}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        onPress={handlePress}
        accessibilityRole="adjustable"
        accessibilityLabel={t('minimap.label')}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(indicatorFraction * 100) }}
        accessibilityActions={[
          { name: 'increment', label: t('minimap.scrollForward') },
          { name: 'decrement', label: t('minimap.scrollBack') },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
      >
        {barWidth > 0 && (
          <View style={[styles.indicator, { left: indicatorLeft, width: indicatorWidth }]} />
        )}
        {barWidth > 0 && highlightRange && (
          <Animated.View
            style={[
              styles.highlight,
              {
                left: Math.max(0, ((highlightRange.startT - T_MIN) / FULL_T_SPAN) * barWidth),
                width: Math.max(
                  4,
                  ((highlightRange.endT - highlightRange.startT) / FULL_T_SPAN) * barWidth,
                ),
                opacity: pulseAnim,
              },
            ]}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    height: 20,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    opacity: 0.55,
    borderRadius: 4,
  },
  highlight: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
});
