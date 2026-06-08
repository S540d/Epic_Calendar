import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEventYear } from '@/timeline/formatYear';
import { colors, radii, spacing, typography } from '@/theme/tokens';
import type { ZoomLevel } from '@/data/schema';

type Props = {
  startYear: number;
  endYear: number;
  zoomLevel?: ZoomLevel;
};

export function TimelineBreadcrumb({ startYear, endYear, zoomLevel }: Props) {
  const { t } = useTranslation();
  const range = `${formatEventYear(startYear, t)} – ${formatEventYear(endYear, t)}`;
  const levelLabel = zoomLevel !== undefined ? t(`zoomLevel.${zoomLevel}`) : null;

  return (
    <View style={styles.pill} pointerEvents="none">
      {levelLabel && (
        <Text style={styles.levelText} numberOfLines={1}>
          {levelLabel}
        </Text>
      )}
      {levelLabel && <Text style={styles.separator}>·</Text>}
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
  levelText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.accent ?? colors.textSecondary,
    fontWeight: '600',
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
