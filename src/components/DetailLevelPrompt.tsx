import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onOpenSettings: () => void;
  onDismiss: () => void;
};

/**
 * One-time, center-screen dialog shown on first launch, pointing new users at
 * the detail-level setting (Kinder / Standard / Alles) in Settings instead of
 * duplicating the picker itself here.
 */
export function DetailLevelPrompt({ visible, onOpenSettings, onDismiss }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t('detailPrompt.title')}</Text>
          <Text style={styles.message}>{t('detailPrompt.message')}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{t('detailPrompt.later')}</Text>
            </Pressable>
            <Pressable
              onPress={onOpenSettings}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>{t('detailPrompt.openSettings')}</Text>
            </Pressable>
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.bgElevated,
      borderRadius: radii.lg,
      padding: spacing.lg,
    },
    title: {
      ...typography.subtitle,
      color: colors.textPrimary,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryText: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    primaryButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      ...typography.body,
      color: colors.bg,
      fontWeight: '700',
    },
    buttonPressed: {
      opacity: 0.8,
    },
  });
}
