import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImportanceLevel } from '@/data/schema';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  detailLevel: ImportanceLevel;
  onDetailLevelChange: (level: ImportanceLevel) => void;
};

const DETAIL_LEVELS: ImportanceLevel[] = ['core', 'extended', 'detail'];

export function SettingsModal({ visible, onClose, detailLevel, onDetailLevelChange }: Props) {
  const { t, i18n } = useTranslation();
  const { isDark, colors, toggleTheme } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    AsyncStorage.setItem('i18n_language', lang).catch(() => {});
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
            <Text style={styles.headerTitle}>{t('settings.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={t('settings.close')}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('settings.darkMode')}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.bgElevated}
                accessibilityLabel={t('settings.darkMode')}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>{t('settings.display')}</Text>
          <View style={styles.section}>
            <Text style={styles.rowLabel}>{t('detailLevel.label')}</Text>
            <View
              style={[styles.segmentGroup, { marginTop: spacing.sm }]}
              accessibilityRole="radiogroup"
            >
              {DETAIL_LEVELS.map((level) => {
                const active = level === detailLevel;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => onDetailLevelChange(level)}
                    style={[styles.segment, active && styles.segmentActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={t(`detailLevel.${level}`)}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {t(`detailLevel.${level}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
          <View style={styles.section}>
            <View style={styles.segmentGroup} accessibilityRole="radiogroup">
              {(['de', 'en'] as const).map((lang) => {
                const active = i18n.language === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => handleLanguageChange(lang)}
                    style={[styles.segment, styles.segmentFull, active && styles.segmentActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={lang === 'de' ? 'Deutsch' : 'English'}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {lang === 'de' ? 'Deutsch' : 'English'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
      paddingBottom: spacing.xl + spacing.lg,
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
    section: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    rowLabel: {
      ...typography.body,
      color: colors.textPrimary,
    },
    segmentGroup: {
      flexDirection: 'row',
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    segment: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    segmentFull: {
      flex: 1,
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
}
