import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tToYear, yearToT } from '@/timeline/scale';
import { colors, typography } from '@/theme/tokens';
import type { ZoomLevel } from '@/data/schema';

export const TIME_AXIS_HEIGHT = 44;
const TICK_LABEL_WIDTH = 64;
const HEUTE_LABEL_WIDTH = 38;
const CURRENT_YEAR = 2026;
const T_NOW = yearToT(CURRENT_YEAR);

function formatYear(year: number, lod: ZoomLevel, t: (key: string) => string): string {
  const abs = Math.abs(year);
  const neg = year < 0;
  const p = neg ? '–' : '';

  if (abs >= 1_000_000_000) return `${p}${(abs / 1e9).toFixed(1)} ${t('axis.billion')}`;
  if (abs >= 1_000_000) return `${p}${Math.round(abs / 1e6)} ${t('axis.million')}`;
  if (abs >= 100_000) return `${p}${Math.round(abs / 1000)}${t('axis.thousand')}`;
  if (abs >= 10_000) return `${p}${(abs / 1000).toFixed(0)}${t('axis.thousand')}`;
  if (year === 0) return '0';
  if (lod >= 3) return `${Math.round(abs)} ${neg ? t('axis.bce') : t('axis.ce')}`;
  return `${p}${Math.round(abs)}`;
}

const TICKS_BY_LOD: Record<ZoomLevel, number> = { 0: 5, 1: 6, 2: 7, 3: 8, 4: 9 };

type Props = {
  offsetX: number;
  pixelsPerUnit: number;
  canvasWidth: number;
  zoomLevel: ZoomLevel;
};

export function TimeAxis({ offsetX, pixelsPerUnit, canvasWidth, zoomLevel }: Props) {
  const { t } = useTranslation();
  const numTicks = TICKS_BY_LOD[zoomLevel];

  const ticks = useMemo(() => {
    const result: Array<{ label: string; px: number }> = [];
    for (let i = 0; i <= numTicks; i++) {
      const px = (i / numTicks) * canvasWidth;
      const tickT = px / pixelsPerUnit + offsetX;
      result.push({ label: formatYear(tToYear(tickT), zoomLevel, t), px });
    }
    return result;
  }, [offsetX, pixelsPerUnit, canvasWidth, zoomLevel, numTicks, t]);

  const heutePx = useMemo(
    () => (T_NOW - offsetX) * pixelsPerUnit,
    [offsetX, pixelsPerUnit],
  );
  const heuteVisible = heutePx >= 0 && heutePx <= canvasWidth;

  return (
    <View style={[styles.axis, { width: canvasWidth }]}>
      <View style={styles.baseline} />
      {ticks.map(({ label, px }, i) => {
        const labelLeft = Math.max(0, Math.min(canvasWidth - TICK_LABEL_WIDTH, px - TICK_LABEL_WIDTH / 2));
        return (
          <React.Fragment key={i}>
            <View style={[styles.tickLine, { left: px }]} />
            <Text style={[styles.tickLabel, { left: labelLeft, fontSize: zoomLevel >= 3 ? 10 : 9 }]} numberOfLines={1}>
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
              { left: Math.max(0, Math.min(canvasWidth - HEUTE_LABEL_WIDTH, heutePx - HEUTE_LABEL_WIDTH / 2)), fontSize: zoomLevel >= 3 ? 10 : 9 },
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
