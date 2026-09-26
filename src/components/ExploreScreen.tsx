import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@/theme/tokens';
import { makeCardGridStyles } from '@/theme/cardGrid';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

type Props = {
  onBack: () => void;
  onOpenFilters: () => void;
  onOpenJourneys: () => void;
  onOpenThemes: () => void;
  /** #212-style quantitative badge ("3/6"), shown on the Filter card when the
   *  selection deviates from the default. */
  filterBadgeLabel?: string;
};

/**
 * Landing page for the three discovery entry points (#239, follow-up of
 * #236's deferred "vorgeschaltete Seite" idea): free filtering, learning
 * journeys and theme-based discovery. Each card routes to its own full-width
 * screen instead of competing for space on the landing page.
 */
export function ExploreScreen({
  onBack,
  onOpenFilters,
  onOpenJourneys,
  onOpenThemes,
  filterBadgeLabel,
}: Props) {
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
          <Text style={styles.title}>{t('explore.title')}</Text>
          <Text style={styles.subtitle}>{t('explore.hint')}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={cardStyles.cardGrid}>
          <Pressable
            style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
            onPress={onOpenFilters}
            accessibilityRole="button"
            accessibilityLabel={t('filterSheet.title')}
            accessibilityHint={t('explore.filterHint')}
          >
            <Text style={cardStyles.cardTitle} numberOfLines={2}>
              {t('filterSheet.title')}
            </Text>
            <Text style={cardStyles.cardMeta} numberOfLines={2}>
              {filterBadgeLabel
                ? t('filterSheet.iconLabelActive', { badge: filterBadgeLabel })
                : t('explore.filterHint')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
            onPress={onOpenJourneys}
            accessibilityRole="button"
            accessibilityLabel={t('learning.sectionTitle')}
            accessibilityHint={t('learning.sectionHint')}
          >
            <Text style={cardStyles.cardTitle} numberOfLines={2}>
              {t('learning.sectionTitle')}
            </Text>
            <Text style={cardStyles.cardMeta} numberOfLines={2}>
              {t('learning.sectionHint')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
            onPress={onOpenThemes}
            accessibilityRole="button"
            accessibilityLabel={t('themeSection.title')}
            accessibilityHint={t('themeSection.hint')}
          >
            <Text style={cardStyles.cardTitle} numberOfLines={2}>
              {t('themeSection.title')}
            </Text>
            <Text style={cardStyles.cardMeta} numberOfLines={2}>
              {t('themeSection.hint')}
            </Text>
          </Pressable>
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
