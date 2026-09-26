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
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

type Props = {
  onSelectEpoch: (startYear: number, endYear: number) => void;
  onShowFullTimeline: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenFilters: () => void;
  /** #212: shown as a badge on the filter icon when the selection deviates
   *  from the default (quantitative, e.g. "3/6"). */
  filterBadgeLabel?: string;
  /** Opens the Explore screen (#239) — filtering, learning journeys and
   *  themes now live there instead of competing for space on this page. */
  onOpenExplore: () => void;
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
  onOpenFilters,
  filterBadgeLabel,
  onOpenExplore,
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
          onPress={onOpenFilters}
          accessibilityLabel={
            filterBadgeLabel
              ? t('filterSheet.iconLabelActive', { badge: filterBadgeLabel })
              : t('filterSheet.iconLabel')
          }
          accessibilityRole="button"
        >
          <Text style={styles.iconButtonText}>🏷</Text>
          {filterBadgeLabel && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterBadgeLabel}</Text>
            </View>
          )}
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
        <Pressable
          style={({ pressed }) => [styles.exploreCard, pressed && styles.tilePressed]}
          onPress={onOpenExplore}
          accessibilityRole="button"
          accessibilityLabel={t('explore.title')}
          accessibilityHint={t('explore.hint')}
        >
          <View style={styles.exploreCardText}>
            <Text style={styles.exploreCardTitle}>{t('explore.title')}</Text>
            <Text style={styles.exploreCardHint}>{t('explore.hint')}</Text>
          </View>
          <Text style={styles.exploreCardArrow}>›</Text>
        </Pressable>

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
    filterBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 20,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.bg,
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
    tilePressed: {
      opacity: 0.75,
    },
    tileArrow: {
      ...typography.body,
      color: colors.textMuted,
      marginLeft: spacing.sm,
    },
    // Single entry point into ExploreScreen (#239), replacing the two card
    // grids (learning journeys, themes) that used to compete for space here
    // (#236). Styled like `fullTimelineButton` below, but with an icon +
    // two-line text block instead of a single centered label.
    exploreCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: spacing.sm,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    exploreCardText: {
      flex: 1,
    },
    exploreCardTitle: {
      ...typography.subtitle,
      color: colors.textPrimary,
    },
    exploreCardHint: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    exploreCardArrow: {
      fontSize: 22,
      color: colors.accent,
    },
  });
}
