import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEventYear } from '@/timeline/formatYear';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import type { ZoomLevel } from '@/data/schema';

type Props = {
  startYear: number;
  endYear: number;
  /** Dominant geological era of the current viewport, e.g. "Mesozoikum". */
  epoch?: string | null;
};

export function TimelineBreadcrumb({ startYear, endYear, epoch }: Props) {
  const { t } = useTranslation();
  const range = `${formatEventYear(startYear, t)} – ${formatEventYear(endYear, t)}`;

  return (
    <View style={styles.pill} pointerEvents="none">
      {epoch ? (
        <Text style={styles.epoch} numberOfLines={1}>
          {epoch}
        </Text>
      ) : null}
      {epoch ? <Text style={styles.separator}>·</Text> : null}
      <Text style={styles.text} numberOfLines={1}>
        {range}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 36, 45, 0.88)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(42, 49, 60, 0.7)',
    gap: 4,
  },
  epoch: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  separator: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.5,
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
