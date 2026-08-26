import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LandmarkTimeline } from './LandmarkTimeline';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { NavigationEpoch } from '@/timeline/epoch';
import { NAVIGATION_EPOCHS } from '@/timeline/epoch';
import { formatEventYear } from '@/timeline/formatYear';
import { LEARNING_JOURNEYS } from '@/data/learningJourneys';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

type Props = {
  onSelectEpoch: (startYear: number, endYear: number) => void;
  onShowFullTimeline: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  /** Starts (or resumes) a guided learning journey by id. */
  onStartJourney: (journeyId: string) => void;
  /** Persisted station index per journey id; absent = not started yet. */
  journeyProgress?: Record<string, number>;
};

function formatDuration(startYear: number, endYear: number, t: TFunction): string {
  const durationYears = Math.abs(endYear - startYear);
  if (durationYears >= 1_000_000_000) {
    return t('epochNav.durationBillion', { n: (durationYears / 1_000_000_000).toFixed(1) });
  }
  if (durationYears >= 1_000_000) {
    return t('epochNav.durationMillion', { n: Math.round(durationYears / 1_000_000) });
  }
  if (durationYears >= 10_000) {
    return t('epochNav.durationThousand', { n: Math.round(durationYears / 1_000) });
  }
  return t('epochNav.durationYears', { n: durationYears.toLocaleString() });
}

function formatYearLabel(year: number, t: TFunction): string {
  if (year >= 2020) return t('event.present');
  return formatEventYear(year, t);
}

type EpochTileProps = {
  epoch: NavigationEpoch;
  onPress: (startYear: number, endYear: number) => void;
  onToggle: (key: string) => void;
  isExpanded: boolean;
  level?: 0 | 1 | 2;
  colors: ThemeColors;
};

/**
 * One epoch row. Epochs that have sub-epochs carry two separate affordances:
 * tapping the body expands them inline (non-destructive, keeps you on the page),
 * while the trailing → button jumps straight to the timeline. Leaf epochs have
 * nothing to expand, so their body jumps directly.
 */
function EpochTile({ epoch, onPress, onToggle, isExpanded, level = 0, colors }: EpochTileProps) {
  const { t } = useTranslation();
  const color = epoch.color;
  const hasChildren = (epoch.children?.length ?? 0) > 0;
  const styles = useMemo(() => makeTileStyles(colors), [colors]);
  const indentStyle =
    level === 1 ? styles.tileIndent : level === 2 ? styles.tileIndent2 : undefined;

  const handleJump = useCallback(() => onPress(epoch.startYear, epoch.endYear), [onPress, epoch]);
  const handleToggle = useCallback(() => onToggle(epoch.key), [onToggle, epoch.key]);

  const name = t(`epochNav.${epoch.key}`);

  return (
    <View style={[styles.tile, indentStyle]}>
      <View style={[styles.tileAccent, { backgroundColor: color }]} />
      <Pressable
        style={({ pressed }) => [styles.tileBody, pressed && styles.tilePressed]}
        onPress={hasChildren ? handleToggle : handleJump}
        accessibilityRole="button"
        accessibilityLabel={name}
        accessibilityState={hasChildren ? { expanded: isExpanded } : undefined}
        accessibilityHint={
          hasChildren ? t(isExpanded ? 'epochNav.collapse' : 'epochNav.expand') : undefined
        }
      >
        <View style={styles.tileNameRow}>
          {hasChildren && <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>}
          <Text style={styles.tileName}>{name}</Text>
        </View>
        <Text style={styles.tileRange}>
          {formatYearLabel(epoch.startYear, t)} – {formatYearLabel(epoch.endYear, t)}
        </Text>
        <View style={[styles.durationBadge, { borderColor: color }]}>
          <Text style={[styles.durationText, { color }]}>
            {formatDuration(epoch.startYear, epoch.endYear, t)}
          </Text>
        </View>
      </Pressable>
      {hasChildren ? (
        <Pressable
          style={({ pressed }) => [styles.jumpButton, pressed && styles.tilePressed]}
          onPress={handleJump}
          accessibilityRole="button"
          accessibilityLabel={`${name} – ${t('epochNav.openTimeline')}`}
        >
          <Text style={styles.jumpArrow}>→</Text>
        </Pressable>
      ) : (
        <Text style={styles.tileArrow}>›</Text>
      )}
    </View>
  );
}

export function EpochOverviewScreen({
  onSelectEpoch,
  onShowFullTimeline,
  onOpenSettings,
  onOpenSearch,
  onStartJourney,
  journeyProgress,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleEpochPress = useCallback(
    (startYear: number, endYear: number) => {
      onSelectEpoch(startYear, endYear);
    },
    [onSelectEpoch],
  );

  // A Set rather than a single open key: two levels can be open at once
  // (humanHistory expanded, and antiquity expanded inside it). Starts empty, so
  // the page always opens on the six main epochs; deliberately not persisted.
  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(() => new Set());

  const handleToggle = useCallback((key: string) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Flattens the visible part of the tree into a single tile list: a node's
  // children only follow it while that node is expanded.
  const tiles = useMemo(() => {
    const render = (epochs: readonly NavigationEpoch[], level: 0 | 1 | 2): React.ReactNode[] =>
      epochs.flatMap((epoch) => {
        const isExpanded = expandedKeys.has(epoch.key);
        const tile = (
          <EpochTile
            key={epoch.key}
            epoch={epoch}
            onPress={handleEpochPress}
            onToggle={handleToggle}
            isExpanded={isExpanded}
            level={level}
            colors={colors}
          />
        );
        if (!isExpanded || !epoch.children?.length || level >= 2) return [tile];
        return [tile, ...render(epoch.children, (level + 1) as 0 | 1 | 2)];
      });
    return render(NAVIGATION_EPOCHS, 0);
  }, [expandedKeys, handleEpochPress, handleToggle, colors]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('epochNav.title')}</Text>
          <Text style={styles.subtitle}>{t('epochNav.subtitle')}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={onOpenSearch}
          accessibilityLabel={t('search.title')}
          accessibilityRole="button"
        >
          <Text style={styles.iconButtonText}>🔍</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={onOpenSettings}
          accessibilityLabel={t('settings.title')}
          accessibilityRole="button"
        >
          <Text style={styles.iconButtonText}>⚙</Text>
        </Pressable>
      </View>

      <LandmarkTimeline onSelectEpoch={handleEpochPress} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('learning.sectionTitle')}</Text>
        <Text style={styles.sectionHint}>{t('learning.sectionHint')}</Text>
        {LEARNING_JOURNEYS.map((journey) => {
          const stepCount = journey.eventIds.length;
          const stored = journeyProgress?.[journey.id];
          const inProgress = stored !== undefined && stored > 0;
          return (
            <Pressable
              key={journey.id}
              style={({ pressed }) => [styles.journeyCard, pressed && styles.tilePressed]}
              onPress={() => onStartJourney(journey.id)}
              accessibilityRole="button"
              accessibilityLabel={t(journey.labelKey)}
              accessibilityHint={t(journey.descriptionKey)}
            >
              <Text style={styles.journeyIcon}>{journey.icon}</Text>
              <View style={styles.journeyText}>
                <Text style={styles.journeyName}>{t(journey.labelKey)}</Text>
                <Text style={styles.journeyDescription} numberOfLines={2}>
                  {t(journey.descriptionKey)}
                </Text>
                <Text style={styles.journeyMeta}>
                  {inProgress
                    ? `${t('learning.continue')} · ${t('learning.progress', {
                        current: Math.min(stored + 1, stepCount),
                        total: stepCount,
                      })}`
                    : t('learning.stations', { count: stepCount })}
                </Text>
              </View>
              <Text style={styles.tileArrow}>›</Text>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>{t('epochNav.title')}</Text>
        {tiles}

        <Pressable
          style={({ pressed }) => [
            styles.fullTimelineButton,
            pressed && styles.fullTimelinePressed,
          ]}
          onPress={onShowFullTimeline}
          accessibilityRole="button"
        >
          <Text style={styles.fullTimelineText}>{t('epochNav.allTime')} →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeTileStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    tileIndent: {
      marginLeft: spacing.md,
      borderRadius: radii.sm - 2,
    },
    tileIndent2: {
      marginLeft: spacing.md * 2,
      borderRadius: radii.sm - 2,
    },
    tilePressed: {
      opacity: 0.75,
    },
    tileAccent: {
      width: 4,
      alignSelf: 'stretch',
    },
    tileBody: {
      flex: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    tileNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    chevron: {
      fontSize: 12,
      color: colors.textMuted,
    },
    tileName: {
      ...typography.subtitle,
      color: colors.textPrimary,
      fontSize: 15,
    },
    tileRange: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    durationBadge: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radii.pill,
      borderWidth: 1,
    },
    durationText: {
      fontSize: 11,
      fontWeight: '600',
    },
    jumpButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    jumpArrow: {
      fontSize: 18,
      color: colors.accent,
    },
    tileArrow: {
      fontSize: 20,
      color: colors.textMuted,
      paddingRight: spacing.sm,
    },
  });
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
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonPressed: {
      backgroundColor: colors.bgElevated,
    },
    iconButtonText: {
      fontSize: 20,
      color: colors.textSecondary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    fullTimelineButton: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radii.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: 'center',
    },
    fullTimelinePressed: {
      opacity: 0.75,
    },
    fullTimelineText: {
      ...typography.body,
      color: colors.accent,
      fontWeight: '600',
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    sectionHint: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    journeyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
      padding: spacing.md,
    },
    journeyIcon: {
      fontSize: 26,
      marginRight: spacing.md,
    },
    journeyText: {
      flex: 1,
    },
    journeyName: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    journeyDescription: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    journeyMeta: {
      ...typography.caption,
      color: colors.accent,
      marginTop: spacing.xs,
      fontWeight: '600',
    },
    tilePressed: {
      opacity: 0.75,
    },
    tileArrow: {
      ...typography.body,
      color: colors.textMuted,
      marginLeft: spacing.sm,
    },
  });
}
