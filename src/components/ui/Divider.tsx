import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  vertical?: boolean;
  style?: ViewStyle;
};

export function Divider({ vertical = false, style }: Props) {
  return (
    <View
      style={[vertical ? styles.vertical : styles.horizontal, style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
});
