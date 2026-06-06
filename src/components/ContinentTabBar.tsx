import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type Continent } from '@/data/schema';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Props = {
  active: Continent;
  onChange: (c: Continent) => void;
};

const TABS: Continent[] = ['europa', 'asien', 'afrika', 'amerika', 'ozeanien'];
const ENABLED: Continent[] = ['europa', 'asien', 'afrika', 'amerika'];

export function ContinentTabBar({ active, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.bar}>
      {TABS.map((c) => {
        const enabled = ENABLED.includes(c);
        const isActive = c === active;
        return (
          <TouchableOpacity
            key={c}
            disabled={!enabled}
            onPress={() => onChange(c)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
                !enabled && styles.tabTextDisabled,
              ]}
              numberOfLines={1}
            >
              {t(`continent.${c}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tabTextDisabled: {
    color: colors.textMuted,
  },
});
