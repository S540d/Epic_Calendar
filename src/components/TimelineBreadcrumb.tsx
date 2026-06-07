import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEventYear } from '@/timeline/formatYear';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Props = {
  startYear: number;
  endYear: number;
};

export function TimelineBreadcrumb({ startYear, endYear }: Props) {
  const { t } = useTranslation();
  const label = `${formatEventYear(startYear, t)} – ${formatEventYear(endYear, t)}`;

  return (
    <View style={styles.pill} pointerEvents="none">
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 6,
    right: 8,
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
    color: colors.textSecondary,
  },
});
