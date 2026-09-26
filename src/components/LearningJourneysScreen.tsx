import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LEARNING_JOURNEYS } from '@/data/learningJourneys';
import { spacing, typography } from '@/theme/tokens';
import { makeCardGridStyles } from '@/theme/cardGrid';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

type Props = {
  onBack: () => void;
  /** Starts (or resumes) a guided learning journey by id. */
  onStartJourney: (journeyId: string) => void;
  /** Persisted station index per journey id; absent = not started yet. */
  journeyProgress?: Record<string, number>;
};

/**
 * Full-width learning-journeys grid, reached via `ExploreScreen` (#239).
 * Card rendering moved here unchanged from `EpochOverviewScreen` (#236) —
 * only the surrounding page (own header/back, no competing Themen section)
 * changed, giving each journey card the room #236 asked for.
 */
export function LearningJourneysScreen({ onBack, onStartJourney, journeyProgress }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const cardStyles = useMemo(() => makeCardGridStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('nav.back')}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('learning.sectionTitle')}</Text>
          <Text style={styles.subtitle}>{t('learning.sectionHint')}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={cardStyles.cardGrid}>
          {LEARNING_JOURNEYS.map((journey) => {
            const stepCount = journey.eventIds.length;
            const stored = journeyProgress?.[journey.id];
            const inProgress = stored !== undefined && stored > 0;
            return (
              <Pressable
                key={journey.id}
                style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
                onPress={() => onStartJourney(journey.id)}
                accessibilityRole="button"
                accessibilityLabel={t(journey.labelKey)}
                accessibilityHint={t(journey.descriptionKey)}
              >
                <Text style={cardStyles.cardTitle} numberOfLines={2}>
                  {t(journey.labelKey)}
                </Text>
                <Text style={cardStyles.cardMeta} numberOfLines={1}>
                  {inProgress
                    ? `${t('learning.continue')} · ${t('learning.progress', {
                        current: Math.min(stored + 1, stepCount),
                        total: stepCount,
                      })}`
                    : t('learning.stations', { count: stepCount })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    backButtonPressed: {
      backgroundColor: colors.bgElevated,
    },
    backArrow: {
      fontSize: 22,
      color: colors.textSecondary,
    },
    headerText: {
      flex: 1,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
  });
}
