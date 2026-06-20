import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme/tokens';
import type { ImportanceLevel } from '@/data/schema';

type Props = {
  value: ImportanceLevel;
  onChange: (level: ImportanceLevel) => void;
};

const LEVELS: readonly ImportanceLevel[] = ['core', 'extended', 'detail'];

/**
 * Cumulative detail-level selector. Picking a higher tier reveals more events,
 * complementing the automatic zoom-based level-of-detail. Single-select.
 */
export function DetailLevelSelector({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('detailLevel.label')}</Text>
      <View style={styles.group} accessibilityRole="radiogroup">
        {LEVELS.map((level) => {
          const isActive = value === level;
          const label = t(`detailLevel.${level}`);
          return (
            <TouchableOpacity
              key={level}
              onPress={() => onChange(level)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              accessibilityLabel={label}
              style={[styles.segment, isActive && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  group: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
