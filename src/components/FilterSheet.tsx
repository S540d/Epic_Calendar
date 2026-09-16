import React, { useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Continent } from '@/data/schema';
import { THEMES } from '@/data/themes';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography, type Category } from '@/theme/tokens';
import { CHIP_CATEGORIES, DISABLED_CATEGORIES } from '@/theme/categories';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Category chips (formerly `FilterChipBar`). */
  activeCategories: Set<Category>;
  onToggleCategory: (cat: Category) => void;
  /** Culture/country filter (formerly `CultureFilterModal`), #163. */
  continent: Continent;
  cultures: string[];
  activeCulture: string | null;
  onSelectCulture: (culture: string | null) => void;
  /** Cross-continent theme filter (#226) — always shown, unlike the culture filter. */
  activeTheme: string | null;
  onSelectTheme: (theme: string | null) => void;
};

/**
 * Bottom-sheet combining category and culture filtering (#212, follow-up of
 * #211). Both used to be permanent chrome (`FilterChipBar` + a culture
 * banner); filtering is an occasional action, so it moves into a sheet like
 * `SettingsModal`/`SearchModal`. The category chip row was also the only
 * place showing category → color, but `TimelineLaneLabels` already carries
 * that legend per lane, so hiding the chips loses no information.
 */
export function FilterSheet({
  visible,
  onClose,
  activeCategories,
  onToggleCategory,
  continent,
  cultures,
  activeCulture,
  onSelectCulture,
  activeTheme,
  onSelectTheme,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleSelectCulture = (culture: string | null) => {
    onSelectCulture(culture);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('filterSheet.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={t('settings.close')}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>{t('filterSheet.categories')}</Text>
            <View style={styles.chipRow}>
              {CHIP_CATEGORIES.map((cat) => {
                const isActive = activeCategories.has(cat);
                const isDisabled = DISABLED_CATEGORIES.includes(cat);
                const label = t(`category.${cat}`);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => !isDisabled && onToggleCategory(cat)}
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
            </View>

            {continent !== 'global' && (
              <>
                <Text style={styles.sectionLabel}>
                  {t('cultureFilter.title', { continent: t(`continent.${continent}`) })}
                </Text>
                {cultures.length === 0 ? (
                  <Text style={styles.hint}>{t('cultureFilter.noCultures')}</Text>
                ) : (
                  <FlatList
                    data={cultures}
                    keyExtractor={(c) => c}
                    scrollEnabled={false}
                    ListHeaderComponent={
                      <TouchableOpacity
                        style={styles.row}
                        onPress={() => handleSelectCulture(null)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activeCulture === null }}
                      >
                        <Text
                          style={[styles.rowText, activeCulture === null && styles.rowTextActive]}
                        >
                          {t('cultureFilter.all')}
                        </Text>
                        {activeCulture === null && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.row}
                        onPress={() => handleSelectCulture(item)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activeCulture === item }}
                      >
                        <Text
                          style={[styles.rowText, activeCulture === item && styles.rowTextActive]}
                        >
                          {item}
                        </Text>
                        {activeCulture === item && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            )}

            <Text style={styles.sectionLabel}>{t('filterSheet.themes')}</Text>
            <FlatList
              data={THEMES}
              keyExtractor={(th) => th.id}
              scrollEnabled={false}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => onSelectTheme(null)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeTheme === null }}
                >
                  <Text style={[styles.rowText, activeTheme === null && styles.rowTextActive]}>
                    {t('themeFilter.all')}
                  </Text>
                  {activeTheme === null && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => onSelectTheme(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeTheme === item.id }}
                >
                  <Text style={[styles.rowText, activeTheme === item.id && styles.rowTextActive]}>
                    {item.icon} {t(item.labelKey)}
                  </Text>
                  {activeTheme === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.doneButtonText}>{t('filterSheet.done')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.bgElevated,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      maxHeight: '80%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: radii.pill,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    headerTitle: {
      ...typography.subtitle,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      marginLeft: spacing.xs,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
      borderWidth: 1,
      backgroundColor: colors.surface,
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
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowText: {
      ...typography.body,
      color: colors.textPrimary,
    },
    rowTextActive: {
      color: colors.accent,
      fontWeight: '700',
    },
    checkmark: {
      ...typography.body,
      color: colors.accent,
      fontWeight: '700',
    },
    doneButton: {
      marginTop: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    doneButtonText: {
      ...typography.body,
      color: colors.bg,
      fontWeight: '700',
    },
  });
}
