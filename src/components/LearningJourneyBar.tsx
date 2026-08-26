import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TimelineEvent } from '@/data/schema';
import { formatEventYear } from '@/timeline/formatYear';
import { CATEGORY_COLORS } from '@/theme/categories';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/tokens';

type Props = {
  /** i18n key of the running journey's name. */
  journeyLabelKey: string;
  /** Current station's event; `null` while the journey has no resolvable step. */
  event: TimelineEvent | null;
  /** 0-based index of the current station. */
  stepIndex: number;
  /** Total number of stations in this journey. */
  stepCount: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
};

/**
 * Bottom card driving the guided "Lernreise": progress, the current station's
 * content, and the step navigation.
 *
 * Deliberately shows the station text itself rather than opening
 * `EventDetailModal` — a full-screen modal per step would hide the timeline,
 * and seeing *where in time* the station sits while reading about it is the
 * whole pedagogical point. Rendered by `TimelineScreen` outside the canvas
 * `ScrollView` so it stays pinned while the timeline scrolls behind it (same
 * reasoning as `TimelineZoomCluster`).
 */
export function LearningJourneyBar({
  journeyLabelKey,
  event,
  stepIndex,
  stepCount,
  onPrev,
  onNext,
  onExit,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= stepCount - 1;
  const accent = event ? CATEGORY_COLORS[event.category] : colors.accent;

  const timeRange = event
    ? `${formatEventYear(event.startYear, t)}${
        event.endYear !== undefined ? ` – ${formatEventYear(event.endYear, t)}` : ''
      }`
    : '';

  return (
    <View style={styles.root} accessibilityLabel={t(journeyLabelKey)}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.journeyName} numberOfLines={1}>
            {t(journeyLabelKey)}
          </Text>
          <Text style={styles.progress}>
            {t('learning.progress', { current: stepIndex + 1, total: stepCount })}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.exitButton, pressed && styles.pressed]}
          onPress={onExit}
          accessibilityRole="button"
          accessibilityLabel={t('learning.exit')}
          accessibilityHint={t('learning.exitHint')}
        >
          <Text style={styles.exitText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.progressTrack} accessibilityElementsHidden importantForAccessibility="no">
        <View
          style={[
            styles.progressFill,
            { backgroundColor: accent, width: `${((stepIndex + 1) / stepCount) * 100}%` },
          ]}
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {event && (
          <>
            <Text style={styles.title} accessibilityRole="header">
              {event.title}
            </Text>
            <Text style={[styles.year, { color: accent }]}>{timeRange}</Text>
            {event.description && <Text style={styles.description}>{event.description}</Text>}
            {event.story && (
              <View style={styles.storyBox}>
                <Text style={styles.storyLabel}>{t('event.story')}</Text>
                <Text style={styles.storyText}>{event.story}</Text>
              </View>
            )}
            {event.mnemonic && (
              <View style={styles.storyBox}>
                <Text style={styles.storyLabel}>{t('event.mnemonic')}</Text>
                <Text style={[styles.mnemonicText, { color: accent }]}>{event.mnemonic}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.nav}>
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            isFirst && styles.navButtonDisabled,
            pressed && !isFirst && styles.pressed,
          ]}
          onPress={onPrev}
          disabled={isFirst}
          accessibilityRole="button"
          accessibilityState={{ disabled: isFirst }}
          accessibilityLabel={t('learning.prev')}
        >
          <Text style={[styles.navText, isFirst && styles.navTextDisabled]}>
            ‹ {t('learning.prev')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            styles.navButtonPrimary,
            { backgroundColor: accent },
            pressed && styles.pressed,
          ]}
          onPress={isLast ? onExit : onNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('learning.finish') : t('learning.next')}
        >
          <Text style={styles.navTextPrimary}>
            {isLast ? t('learning.finish') : `${t('learning.next')} ›`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: '55%',
      backgroundColor: colors.bgElevated,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: spacing.md,
    },
    accentBar: {
      height: 4,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    journeyName: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    progress: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    exitButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exitText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    progressTrack: {
      height: 3,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    progressFill: {
      height: 3,
      borderRadius: radii.pill,
    },
    content: {
      flexGrow: 0,
    },
    contentInner: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    year: {
      ...typography.subtitle,
      marginTop: 2,
      marginBottom: spacing.sm,
    },
    description: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    storyBox: {
      marginTop: spacing.md,
      padding: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.bg,
    },
    storyLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    storyText: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    mnemonicText: {
      ...typography.body,
      fontStyle: 'italic',
    },
    nav: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    navButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonPrimary: {
      borderColor: 'transparent',
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    navText: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    navTextDisabled: {
      color: colors.textMuted,
    },
    navTextPrimary: {
      ...typography.body,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
