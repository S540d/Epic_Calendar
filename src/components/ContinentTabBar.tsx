import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type Continent } from '@/data/schema';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

type Props = {
  active: Continent;
  onChange: (c: Continent) => void;
  /**
   * Pressing the already-active tab again opens the culture/country filter
   * for that continent (#163) instead of a no-op `onChange`.
   */
  onPressActive?: (c: Continent) => void;
  /** Shows a small filter-active indicator on the active tab (#163). */
  cultureFilterActive?: boolean;
};

const TABS: Continent[] = ['global', 'europa', 'asien', 'afrika', 'amerika', 'ozeanien'];
const ENABLED: Continent[] = ['global', 'europa', 'asien', 'afrika', 'amerika'];

export function ContinentTabBar({ active, onChange, onPressActive, cultureFilterActive }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.bar} accessibilityRole="tablist" accessibilityLabel="Kontinente">
      {TABS.map((c) => {
        const enabled = ENABLED.includes(c);
        const isActive = c === active;
        const showFilterDot = isActive && cultureFilterActive;
        const label = t(`continent.${c}`);
        const accessibilityLabel = !enabled
          ? `${label} – bald verfügbar`
          : isActive
            ? `${label}${cultureFilterActive ? `, ${t('cultureFilter.activeShort')}` : ''}, ${t('cultureFilter.openHint')}`
            : label;
        return (
          <TouchableOpacity
            key={c}
            disabled={!enabled}
            onPress={() => (isActive ? onPressActive?.(c) : onChange(c))}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: !enabled }}
            accessibilityLabel={accessibilityLabel}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <View style={styles.tabLabelRow}>
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                  !enabled && styles.tabTextDisabled,
                ]}
                numberOfLines={1}
                importantForAccessibility="no"
              >
                {label}
              </Text>
              {showFilterDot && <View style={styles.filterDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    tabLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
      marginLeft: 4,
    },
  });
}
