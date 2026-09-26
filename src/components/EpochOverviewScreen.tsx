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
import { DiscoveryTile, flattenTiles, type TileNode } from './DiscoveryTile';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { NavigationEpoch } from '@/timeline/epoch';
import { NAVIGATION_EPOCHS } from '@/timeline/epoch';
import { formatEventYear } from '@/timeline/formatYear';
import { ALL_EVENTS } from '@/data/events';
import { LEARNING_JOURNEYS } from '@/data/learningJourneys';
import { childrenOf, eventMatchesTheme, topLevelThemes, type Theme } from '@/data/themes';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

type Props = {
  onSelectEpoch: (startYear: number, endYear: number) => void;
  onShowFullTimeline: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenFilters: () => void;
  /** #212: shown as a meta line on the "Eigener Filter" tiles when the
   *  selection deviates from the default (quantitative, e.g. "3/6"). */
  filterBadgeLabel?: string;
  /** Starts (or resumes) a guided learning journey by id. */
  onStartJourney: (journeyId: string) => void;
  /** Persisted station index per journey id; absent = not started yet. */
  journeyProgress?: Record<string, number>;
  /** Activates (or, if already active, clears) the cross-continent theme filter (#226). */
  onSelectTheme: (themeId: string) => void;
  /** Currently active theme filter id, if any — highlights the matching tile. */
  activeTheme?: string | null;
};

/** Sorts by a translated label in the given locale — used to order Lernreisen/Themen alphabetically in the active app language (reactive to language switches). */
function sortByLabel<T>(items: readonly T[], labelOf: (item: T) => string, locale: string): T[] {
  return [...items].sort((a, b) => labelOf(a).localeCompare(labelOf(b), locale));
}

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
  onStartJourney,
  journeyProgress,
  onSelectTheme,
  activeTheme,
}: Props) {
  const { t, i18n } = useTranslation();
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

  // "Eigener Filter" — leaf tile, sibling of Lernreisen/Themen under Erkunden
  // (#212 badge shown as its meta line, same text the old Explore-card meta used).
  const ownFilterNode: TileNode = useMemo(
    () => ({
      key: 'own-filter',
      label: t('filterSheet.setOwnFilters'),
      meta: filterBadgeLabel
        ? t('filterSheet.iconLabelActive', { badge: filterBadgeLabel })
        : undefined,
      onPress: onOpenFilters,
    }),
    [t, filterBadgeLabel, onOpenFilters],
  );

  // Lernreisen — flat, no children, alphabetical in the active language.
  // Wrapped one level deeper (children of the "Lernreisen" node below) so
  // Erkunden mirrors Zeitreise: a heading, then top-level categories that
  // expand like "Menschheitsgeschichte" does.
  const journeyNodes: TileNode[] = useMemo(
    () =>
      sortByLabel(LEARNING_JOURNEYS, (j) => t(j.labelKey), i18n.language).map((journey) => {
        const stepCount = journey.eventIds.length;
        const stored = journeyProgress?.[journey.id];
        const inProgress = stored !== undefined && stored > 0;
        return {
          key: journey.id,
          label: t(journey.labelKey),
          meta: inProgress
            ? `${t('learning.continue')} · ${t('learning.progress', {
                current: Math.min(stored + 1, stepCount),
                total: stepCount,
              })}`
            : t('learning.stations', { count: stepCount }),
          onPress: () => onStartJourney(journey.id),
        };
      }),
    [t, i18n.language, journeyProgress, onStartJourney],
  );

  // Themen section — top-level themes + their sub-themes (#226-Folge),
  // alphabetical at every level. A theme with children can still be selected
  // directly (trailing action / EpochTile-style "→" jump), matching all its
  // descendants via `eventMatchesTheme`'s tag union.
  const themeEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const th of topLevelThemes()) {
      counts.set(th.id, ALL_EVENTS.filter((ev) => eventMatchesTheme(ev, th.id)).length);
      for (const child of childrenOf(th.id)) {
        counts.set(child.id, ALL_EVENTS.filter((ev) => eventMatchesTheme(ev, child.id)).length);
      }
    }
    return counts;
  }, []);

  const buildThemeNode = useCallback(
    (theme: Theme): TileNode => {
      const children = childrenOf(theme.id);
      return {
        key: theme.id,
        label: t(theme.labelKey),
        meta: t('themeSection.eventCount', { count: themeEventCounts.get(theme.id) ?? 0 }),
        onPress: () => onSelectTheme(theme.id),
        children:
          children.length > 0
            ? sortByLabel(children, (c) => t(c.labelKey), i18n.language).map(buildThemeNode)
            : undefined,
      };
    },
    [t, i18n.language, themeEventCounts, onSelectTheme],
  );

  const themeNodes: TileNode[] = useMemo(
    () => sortByLabel(topLevelThemes(), (th) => t(th.labelKey), i18n.language).map(buildThemeNode),
    [t, i18n.language, buildThemeNode],
  );

  // Erkunden — mirrors the Zeitreise section exactly: one heading, then
  // top-level categories (Lernreisen, Themen, Eigener Filter) at level 0.
  // "Lernreisen"/"Themen" have no direct action of their own (no trailing
  // "→" button, see DiscoveryTile) — tapping their body only expands them,
  // exactly like a parent epoch such as "Menschheitsgeschichte". A theme
  // with its own sub-themes (e.g. "Aufklärung & Wissenschaft") still gets
  // the trailing action, since selecting it directly makes sense there.
  const erkundenNodes: TileNode[] = useMemo(
    () => [
      { key: 'lernreisen', label: t('learning.sectionTitle'), children: journeyNodes },
      { key: 'themen', label: t('themeSection.title'), children: themeNodes },
      ownFilterNode,
    ],
    [t, journeyNodes, themeNodes, ownFilterNode],
  );

  const [expandedErkundenKeys, setExpandedErkundenKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const toggleErkundenExpanded = useCallback((key: string) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedErkundenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const erkundenTiles = useMemo(
    () => flattenTiles(erkundenNodes, expandedErkundenKeys),
    [erkundenNodes, expandedErkundenKeys],
  );

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

        <Text style={styles.sectionTitle}>{t('explore.title')}</Text>
        {erkundenTiles.map(({ node, level }) => (
          <DiscoveryTile
            key={node.key}
            node={node}
            level={level}
            isExpanded={expandedErkundenKeys.has(node.key)}
            onToggle={toggleErkundenExpanded}
            isActive={activeTheme === node.key}
          />
        ))}
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
  });
}
