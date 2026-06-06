import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography, type Category } from '@/theme/tokens';

type Props = {
  active: Set<Category>;
  onToggle: (cat: Category) => void;
};

const CHIPS: Category[] = ['erdzeitalter', 'zivilisation', 'nation', 'herrscher', 'natur'];
const DISABLED: Category[] = ['natur'];

export function FilterChipBar({ active, onToggle }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.row}
    >
      {CHIPS.map((cat) => {
        const isActive = active.has(cat);
        const isDisabled = DISABLED.includes(cat);
        const label = t(`category.${cat}`);
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => !isDisabled && onToggle(cat)}
            disabled={isDisabled}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isActive, disabled: isDisabled }}
            accessibilityLabel={isDisabled ? `${label} – ${t('chip.soon')}` : label}
            style={[
              styles.chip,
              { borderColor: colors.category[cat] },
              isActive && { backgroundColor: colors.category[cat] },
              isDisabled && styles.chipDisabled,
            ]}
          >
            <View
              style={[styles.dot, { backgroundColor: colors.category[cat] }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text
              style={[
                styles.chipText,
                isActive && { color: colors.bg },
                isDisabled && { color: colors.textMuted },
              ]}
              importantForAccessibility="no"
            >
              {label}
              {isDisabled ? `  ·  ${t('chip.soon')}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexShrink: 0,
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: colors.bgElevated,
    gap: spacing.sm,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
