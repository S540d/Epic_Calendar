import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tToYear } from '@/timeline/scale';
import { colors, typography } from '@/theme/tokens';

export const TIME_AXIS_HEIGHT = 38;
const NUM_TICKS = 5;
const TICK_LABEL_WIDTH = 52;

function formatYear(year: number): string {
  const abs = Math.abs(year);
  const neg = year < 0;
  if (abs >= 1_000_000_000) return `${neg ? '–' : ''}${(abs / 1e9).toFixed(1)} Mrd`;
  if (abs >= 1_000_000) return `${neg ? '–' : ''}${Math.round(abs / 1e6)} Mio`;
  if (abs >= 10_000) return `${neg ? '–' : ''}${Math.round(abs / 1000)}k`;
  if (abs >= 1000) return `${neg ? '–' : ''}${Math.round(abs)}`;
  if (year === 0) return '0';
  return `${neg ? '–' : ''}${Math.round(abs)}`;
}

type Props = {
  offsetX: number;
  pixelsPerUnit: number;
  canvasWidth: number;
};

export function TimeAxis({ offsetX, pixelsPerUnit, canvasWidth }: Props) {
  const ticks = useMemo(() => {
    const result: Array<{ label: string; px: number }> = [];
    for (let i = 0; i <= NUM_TICKS; i++) {
      const px = (i / NUM_TICKS) * canvasWidth;
      const t = px / pixelsPerUnit + offsetX;
      result.push({ label: formatYear(tToYear(t)), px });
    }
    return result;
  }, [offsetX, pixelsPerUnit, canvasWidth]);

  return (
    <View style={[styles.axis, { width: canvasWidth }]}>
      <View style={styles.baseline} />
      {ticks.map(({ label, px }, i) => {
        const labelLeft = Math.max(0, Math.min(canvasWidth - TICK_LABEL_WIDTH, px - TICK_LABEL_WIDTH / 2));
        return (
          <React.Fragment key={i}>
            <View style={[styles.tickLine, { left: px }]} />
            <Text style={[styles.tickLabel, { left: labelLeft }]} numberOfLines={1}>
              {label}
            </Text>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  axis: {
    height: TIME_AXIS_HEIGHT,
    position: 'relative',
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  baseline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  tickLine: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 8,
    backgroundColor: colors.textMuted,
  },
  tickLabel: {
    position: 'absolute',
    top: 10,
    width: TICK_LABEL_WIDTH,
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
