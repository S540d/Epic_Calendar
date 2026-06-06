import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Variant = 'filled' | 'outlined';

type Props = {
  label: string;
  color?: string;
  variant?: Variant;
  style?: ViewStyle;
};

export function Badge({ label, color = colors.accent, variant = 'filled', style }: Props) {
  const isFilled = variant === 'filled';
  return (
    <View
      style={[
        styles.badge,
        isFilled
          ? { backgroundColor: color }
          : { borderColor: color, borderWidth: 1, backgroundColor: 'transparent' },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text
        style={[styles.label, { color: isFilled ? colors.bg : color }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
});
