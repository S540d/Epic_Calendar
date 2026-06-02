import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CATEGORY_LABELS } from '@/data/schema';
import { colors, radii, spacing, typography, type Category } from '@/theme/tokens';

type Props = {
  active: Set<Category>;
  onToggle: (cat: Category) => void;
};

const CHIPS: Category[] = ['erdzeitalter', 'zivilisation', 'nation', 'herrscher', 'natur'];
const DISABLED: Category[] = ['natur'];

export function FilterChipBar({ active, onToggle }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CHIPS.map((cat) => {
        const isActive = active.has(cat);
        const isDisabled = DISABLED.includes(cat);
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => !isDisabled && onToggle(cat)}
            disabled={isDisabled}
            style={[
              styles.chip,
              { borderColor: colors.category[cat] },
              isActive && { backgroundColor: colors.category[cat] },
              isDisabled && styles.chipDisabled,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: colors.category[cat] }]} />
            <Text
              style={[
                styles.chipText,
                isActive && { color: colors.bg },
                isDisabled && { color: colors.textMuted },
              ]}
            >
              {CATEGORY_LABELS[cat]}
              {isDisabled ? '  ·  bald' : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
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
