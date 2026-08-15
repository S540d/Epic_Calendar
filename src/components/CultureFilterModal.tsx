import React, { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Continent } from '@/data/schema';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/tokens';

type Props = {
  visible: boolean;
  continent: Continent;
  /** Distinct `culture` values available for the current continent, already sorted. */
  cultures: string[];
  /** Currently active filter, or `null` when unfiltered. */
  active: string | null;
  onSelect: (culture: string | null) => void;
  onClose: () => void;
};

/**
 * Bottom-sheet listing the cultures/civilizations present in the current
 * continent (#163). Opened by pressing the already-active continent tab
 * again. Selecting a row filters the timeline to that culture; "Alle
 * anzeigen" clears the filter. The active selection is highlighted so it's
 * unambiguous which filter (if any) is applied — see issue #163.
 */
export function CultureFilterModal({
  visible,
  continent,
  cultures,
  active,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleSelect = (culture: string | null) => {
    onSelect(culture);
    onClose();
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
            <Text style={styles.title}>
              {t('cultureFilter.title', { continent: t(`continent.${continent}`) })}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={t('search.close')}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {cultures.length === 0 ? (
            <Text style={styles.hint}>{t('cultureFilter.noCultures')}</Text>
          ) : (
            <FlatList
              data={cultures}
              keyExtractor={(c) => c}
              style={styles.list}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleSelect(null)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active === null }}
                >
                  <Text style={[styles.rowText, active === null && styles.rowTextActive]}>
                    {t('cultureFilter.all')}
                  </Text>
                  {active === null && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleSelect(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active === item }}
                >
                  <Text style={[styles.rowText, active === item && styles.rowTextActive]}>
                    {item}
                  </Text>
                  {active === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          )}
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
      maxHeight: '70%',
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
    title: {
      ...typography.body,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
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
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    list: {
      flexGrow: 0,
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
  });
}
