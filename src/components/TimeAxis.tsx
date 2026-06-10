import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tToYear, yearToT, yearToPixel } from '@/timeline/scale';
import { colors, typography } from '@/theme/tokens';
import type { ZoomLevel } from '@/data/schema';

export const TIME_AXIS_HEIGHT = 44;
const TICK_LABEL_WIDTH = 72;
const HEUTE_LABEL_WIDTH = 38;
const CURRENT_YEAR = 2026;
const T_NOW = yearToT(CURRENT_YEAR);

/**
 * Candidate step sizes in years, ordered from finest to coarsest.
 * The algorithm picks the coarsest step that still yields at least MIN_TICKS
 * and no more than MAX_TICKS visible ticks.
 */
const STEP_CANDIDATES = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 50_000, 100_000, 500_000,
  1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000, 1_000_000_000,
  5_000_000_000,
];

const MIN_TICKS = 3;
const MAX_TICKS = 9;
/** Minimum pixel gap between two adjacent tick labels to avoid overlap. */
const MIN_TICK_PX_GAP = 56;

function formatYear(year: number, t: (key: string) => string): string {
  const abs = Math.abs(year);
  const neg = year < 0;
  const p = neg ? '–' : '';

  if (abs >= 1_000_000_000) return `${p}${(abs / 1e9).toFixed(1)} ${t('axis.billion')}`;
  if (abs >= 1_000_000) return `${p}${Math.round(abs / 1e6)} ${t('axis.million')}`;
  if (abs >= 100_000) return `${p}${Math.round(abs / 1000)}${t('axis.thousand')}`;
  if (abs >= 10_000) return `${p}${(abs / 1000).toFixed(0)}${t('axis.thousand')}`;
  if (year === 0) return '0';
  if (neg) return `${Math.round(abs)} ${t('axis.bce')}`;
  return `${Math.round(abs)}`;
}

type Tick = { label: string; px: number };

function generateTicks(
  offsetX: number,
  pixelsPerUnit: number,
  canvasWidth: number,
  t: (key: string) => string,
): Tick[] {
  const startYear = tToYear(offsetX);
  const endYear = tToYear(offsetX + canvasWidth / pixelsPerUnit);
  const span = endYear - startYear;

  // Pick the finest step that keeps ticks within [MIN_TICKS, MAX_TICKS] and
  // has enough pixel gap between adjacent ticks to avoid label collisions.
  let chosenStep: number = STEP_CANDIDATES[STEP_CANDIDATES.length - 1]!;
  for (const step of STEP_CANDIDATES) {
    const count = Math.floor(span / step);
    if (count < MIN_TICKS) continue;
    if (count > MAX_TICKS) continue;

    // Estimate pixel gap: two consecutive round multiples of step.
    const sampleYear = Math.ceil(startYear / step) * step;
    const nextYear = sampleYear + step;
    const pxA = yearToPixel(sampleYear, offsetX, pixelsPerUnit);
    const pxB = yearToPixel(nextYear, offsetX, pixelsPerUnit);
    if (Math.abs(pxB - pxA) < MIN_TICK_PX_GAP) continue;

    chosenStep = step;
    break;
  }

  // First tick: smallest multiple of chosenStep that is >= startYear.
  const firstTick = Math.ceil(startYear / chosenStep) * chosenStep;

  const ticks: Tick[] = [];
  for (let year = firstTick; year <= endYear; year += chosenStep) {
    const px = yearToPixel(year, offsetX, pixelsPerUnit);
    if (px < 0 || px > canvasWidth) continue;
    ticks.push({ label: formatYear(year, t), px });
  }
  return ticks;
}

type Props = {
  offsetX: number;
  pixelsPerUnit: number;
  canvasWidth: number;
  zoomLevel: ZoomLevel;
};

export function TimeAxis({ offsetX, pixelsPerUnit, canvasWidth }: Props) {
  const { t } = useTranslation();

  const ticks = useMemo(
    () => generateTicks(offsetX, pixelsPerUnit, canvasWidth, t),
    [offsetX, pixelsPerUnit, canvasWidth, t],
  );

  const heutePx = useMemo(() => (T_NOW - offsetX) * pixelsPerUnit, [offsetX, pixelsPerUnit]);
  const heuteVisible = heutePx >= 0 && heutePx <= canvasWidth;

  return (
    <View style={[styles.axis, { width: canvasWidth }]}>
      <View style={styles.baseline} />
      {ticks.map(({ label, px }, i) => {
        const labelLeft = Math.max(
          0,
          Math.min(canvasWidth - TICK_LABEL_WIDTH, px - TICK_LABEL_WIDTH / 2),
        );
        return (
          <React.Fragment key={i}>
            <View style={[styles.tickLine, { left: px }]} />
            <Text style={[styles.tickLabel, { left: labelLeft }]} numberOfLines={1}>
              {label}
            </Text>
          </React.Fragment>
        );
      })}
      {heuteVisible && (
        <>
          <View style={[styles.heuteLine, { left: heutePx }]} />
          <Text
            style={[
              styles.heuteLabel,
              {
                left: Math.max(
                  0,
                  Math.min(canvasWidth - HEUTE_LABEL_WIDTH, heutePx - HEUTE_LABEL_WIDTH / 2),
                ),
              },
            ]}
            numberOfLines={1}
          >
            {t('axis.today')}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  axis: {
    height: TIME_AXIS_HEIGHT,
    position: 'relative',
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    height: 10,
    backgroundColor: colors.textMuted,
  },
  tickLabel: {
    position: 'absolute',
    top: 12,
    width: TICK_LABEL_WIDTH,
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  heuteLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: TIME_AXIS_HEIGHT,
    backgroundColor: '#FF5050',
  },
  heuteLabel: {
    position: 'absolute',
    top: 27,
    width: HEUTE_LABEL_WIDTH,
    ...typography.caption,
    fontWeight: '700',
    color: '#FF5050',
    textAlign: 'center',
  },
});
