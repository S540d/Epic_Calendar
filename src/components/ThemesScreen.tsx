import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ALL_EVENTS } from '@/data/events';
import { eventMatchesTheme, topLevelThemes } from '@/data/themes';
import { spacing, typography } from '@/theme/tokens';
import { makeCardGridStyles } from '@/theme/cardGrid';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

type Props = {
  onBack: () => void;
  /** Activates (or, if already active, clears) the cross-continent theme filter (#226) and leaves the overview. */
  onSelectTheme: (themeId: string) => void;
  /** Currently active theme filter id, if any — highlights the matching chip. */
  activeTheme?: string | null;
};

/**
 * Full-width themes grid, reached via `ExploreScreen` (#239). Card rendering
 * moved here unchanged from `EpochOverviewScreen` (#236) — only the
 * surrounding page (own header/back, no competing Lernreisen section)
 * changed, giving each theme card the room #236 asked for.
 */
export function ThemesScreen({ onBack, onSelectTheme, activeTheme }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const cardStyles = useMemo(() => makeCardGridStyles(colors), [colors]);

  // Event count per theme (#226) — cheap over 605 events, so computed inline
  // rather than threaded through props like journey progress.
  const themes = useMemo(() => topLevelThemes(), []);
  const themeEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const theme of themes) {
      counts.set(theme.id, ALL_EVENTS.filter((ev) => eventMatchesTheme(ev, theme.id)).length);
    }
    return counts;
  }, [themes]);

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
          <Text style={styles.title}>{t('themeSection.title')}</Text>
          <Text style={styles.subtitle}>{t('themeSection.hint')}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={cardStyles.cardGrid}>
          {themes.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <Pressable
                key={theme.id}
                style={({ pressed }) => [
                  cardStyles.card,
                  isActive && cardStyles.cardActive,
                  pressed && cardStyles.cardPressed,
                ]}
                onPress={() => onSelectTheme(theme.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t(theme.labelKey)}
                accessibilityHint={t('themeSection.eventCount', {
                  count: themeEventCounts.get(theme.id) ?? 0,
                })}
              >
                <Text
                  style={[cardStyles.cardTitle, isActive && cardStyles.cardTitleActive]}
                  numberOfLines={2}
                >
                  {t(theme.labelKey)}
                </Text>
                <Text style={[cardStyles.cardMeta, isActive && cardStyles.cardMetaActive]}>
                  {t('themeSection.eventCount', { count: themeEventCounts.get(theme.id) ?? 0 })}
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
