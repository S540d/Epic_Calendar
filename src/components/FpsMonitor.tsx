import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFpsMonitor } from './useFpsMonitor';
import { radii, spacing, typography } from '@/theme/tokens';

type Props = {
  enabled: boolean;
};

const GOOD_FPS_THRESHOLD = 50;
const OK_FPS_THRESHOLD = 30;
const GOOD_COLOR = '#4ADE80';
const OK_COLOR = '#FACC15';
const BAD_COLOR = '#F87171';

/**
 * Persistent, non-interactive pill showing the measured render frame rate
 * (#5 FPS-Monitoring). Opt-in via Settings → Darstellung; dev/perf-diagnostic
 * tool, not shown by default.
 */
export const FpsMonitor = React.memo(function FpsMonitor({ enabled }: Props) {
  const fps = useFpsMonitor(enabled);

  if (!enabled) return null;

  const color =
    fps >= GOOD_FPS_THRESHOLD ? GOOD_COLOR : fps >= OK_FPS_THRESHOLD ? OK_COLOR : BAD_COLOR;

  return (
    <View style={styles.pill} pointerEvents="none">
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {fps} FPS
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(31, 36, 45, 0.88)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(42, 49, 60, 0.7)',
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
