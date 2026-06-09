import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { clampOffsetX, T_MIN, T_MAX, FULL_T_SPAN } from '@/timeline/lod';
import { colors, LANE_LABEL_WIDTH, spacing } from '@/theme/tokens';

type Props = {
  /** Left edge of the current viewport in T units (from offsetX shared value, JS copy). */
  offsetX: number;
  pixelsPerUnit: number;
  canvasWidth: number;
  /** Called when the user taps the minimap; receives the new offsetX to jump to. */
  onJump: (newOffsetX: number) => void;
};

export function TimelineMinimap({ offsetX, pixelsPerUnit, canvasWidth, onJump }: Props) {
  const [barWidth, setBarWidth] = useState(0);

  if (!pixelsPerUnit) return null;
  const tSpan = canvasWidth / pixelsPerUnit;
  const indicatorFraction = (offsetX - T_MIN) / FULL_T_SPAN;
  const indicatorLeft = Math.max(0, Math.min(indicatorFraction * barWidth, barWidth - 4));
  const indicatorRawWidth = (tSpan / FULL_T_SPAN) * barWidth;
  // Minimum 4px so the indicator is always visible even at very high zoom levels.
  const indicatorWidth = Math.max(4, Math.min(indicatorRawWidth, barWidth - indicatorLeft));

  function handlePress(e: { nativeEvent: { locationX: number } }) {
    if (!barWidth) return;
    const fraction = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth));
    const tAtTap = T_MIN + fraction * FULL_T_SPAN;
    onJump(clampOffsetX(tAtTap - tSpan / 2, pixelsPerUnit, canvasWidth));
  }

  return (
    <View style={styles.wrapper}>
      <View style={{ width: LANE_LABEL_WIDTH }} />
      <Pressable
        style={styles.track}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        onPress={handlePress}
        accessibilityRole="adjustable"
      >
        <View style={[styles.indicator, { left: indicatorLeft, width: indicatorWidth }]} />
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
});
