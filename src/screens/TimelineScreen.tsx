import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ContinentTabBar } from '@/components/ContinentTabBar';
import { DetailLevelPrompt } from '@/components/DetailLevelPrompt';
import { EpochOverviewScreen } from '@/components/EpochOverviewScreen';
import { FilterSheet } from '@/components/FilterSheet';
import { LearningJourneyBar } from '@/components/LearningJourneyBar';
import { SearchModal } from '@/components/SearchModal';
import { SettingsModal } from '@/components/SettingsModal';
import { TimelineView, type TimelineViewHandle } from '@/components/TimelineView';
import {
  TimelineZoomCluster,
  type TimelineZoomClusterHandle,
} from '@/components/TimelineZoomCluster';
import { EventDetailModal } from '@/screens/EventDetailModal';
import { usePersistedState } from '@/hooks/usePersistedState';
import { ALL_EVENTS } from '@/data/events';
import { journeyById, resolveJourneySteps } from '@/data/learningJourneys';
import type { Continent, ImportanceLevel, TimelineEvent } from '@/data/schema';
import { globalEventIndex } from '@/timeline/globalEventIndex';
import { spacing, typography, type Category } from '@/theme/tokens';
import { CHIP_CATEGORIES, DEFAULT_CATEGORIES } from '@/theme/categories';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

export function TimelineScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [persistedCategories, setPersistedCategories] = usePersistedState<Category[]>(
    'activeCategories',
    [...DEFAULT_CATEGORIES],
  );
  const activeCategories = new Set<Category>(persistedCategories);

  const [continent, setContinent] = usePersistedState<Continent>('selectedContinent', 'europa');
  const [cultureFilter, setCultureFilter] = useState<string | null>(null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [detailLevel, setDetailLevel] = usePersistedState<ImportanceLevel>('detailLevel', 'detail');
  const [showFpsMonitor, setShowFpsMonitor] = usePersistedState<boolean>('showFpsMonitor', false);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [showOverview, setShowOverview] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [detailPromptSeen, setDetailPromptSeen] = usePersistedState<boolean>(
    'detailLevelPromptSeen',
    false,
  );
  // Guided learning journey (#171 follow-up). The *active* journey is session
  // state (a mode you're currently in), while the per-journey station index is
  // persisted so a journey can be resumed days later from the landing page.
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeyProgress, setJourneyProgress] = usePersistedState<Record<string, number>>(
    'learningJourneyProgress',
    {},
  );
  const [epochRange, setEpochRange] = useState<{ startYear: number; endYear: number } | undefined>(
    undefined,
  );
  const canvasScrollRef = useRef<ScrollView>(null);
  const timelineViewRef = useRef<TimelineViewHandle>(null);
  const [jumpToEvent, setJumpToEvent] = useState<
    { event: TimelineEvent; requestId: number; openDetail?: boolean } | undefined
  >(undefined);
  const [jumpToYear, setJumpToYear] = useState<{ year: number; requestId: number } | undefined>(
    undefined,
  );
  const jumpRequestIdRef = useRef(0);
  // #215: any canvas touch (pan/pinch/tap) wakes TimelineZoomCluster from its
  // inactivity fade via this ref — an imperative call from the actual event
  // handler below, not a prop bump routed through an effect (which would call
  // setState synchronously inside an effect and risk a cascading render).
  const zoomClusterRef = useRef<TimelineZoomClusterHandle>(null);

  const toggleCategory = (cat: Category) => {
    setPersistedCategories((prev) => {
      const set = new Set(prev);
      if (set.has(cat)) set.delete(cat);
      else set.add(cat);
      return Array.from(set);
    });
  };

  const handleSelectEpoch = useCallback((startYear: number, endYear: number) => {
    setEpochRange({ startYear, endYear });
    setShowOverview(false);
  }, []);

  const handleShowFullTimeline = useCallback(() => {
    setEpochRange({ startYear: -13_800_000_000, endYear: 2026 });
    setShowOverview(false);
  }, []);

  const handleHomePress = useCallback(() => {
    setShowOverview(true);
    setEpochRange(undefined);
    // Going home leaves the journey mode but keeps its progress, so it can be
    // resumed from the landing page.
    setActiveJourneyId(null);
  }, []);

  const handleOpenSettings = useCallback(() => setSettingsVisible(true), []);
  const handleCloseSettings = useCallback(() => setSettingsVisible(false), []);
  const handleOpenSearch = useCallback(() => setSearchVisible(true), []);
  const handleCloseSearch = useCallback(() => setSearchVisible(false), []);

  // Switching continents invalidates the culture filter — cultures are scoped
  // per continent, so a stale filter would silently hide everything (#163).
  const handleContinentChange = useCallback(
    (c: Continent) => {
      setContinent(c);
      setCultureFilter(null);
    },
    [setContinent],
  );
  // #212: the culture filter's own entry point (re-tapping the active
  // continent tab, #163) and the new explicit filter icon both open the same
  // FilterSheet — the tab gesture is kept as a shortcut, not the only way in.
  const handleOpenFilterSheet = useCallback(() => setFilterSheetVisible(true), []);
  const handleCloseFilterSheet = useCallback(() => setFilterSheetVisible(false), []);

  // Cultures available for the current continent, for the #163 filter sheet.
  const availableCultures = useMemo(
    () => (continent === 'global' ? [] : globalEventIndex.culturesForContinent(continent)),
    [continent],
  );

  const handleDismissDetailPrompt = useCallback(
    () => setDetailPromptSeen(true),
    [setDetailPromptSeen],
  );
  const handleOpenSettingsFromPrompt = useCallback(() => {
    setDetailPromptSeen(true);
    setSettingsVisible(true);
  }, [setDetailPromptSeen]);

  // Brings a specific event into view: activates its category/continent so the
  // target is actually visible under the current filters, leaves the overview,
  // and triggers the zoom-to-fit jump in TimelineView. Shared by search (#146 A)
  // and the guided learning journey — the latter passes `openDetail: false`
  // because its own bar shows the station content.
  const focusEvent = useCallback(
    (event: TimelineEvent, openDetail: boolean) => {
      setPersistedCategories((prev) =>
        prev.includes(event.category) ? prev : [...prev, event.category],
      );
      if (event.continent !== 'global') {
        setContinent(event.continent);
        setCultureFilter(null);
      }
      setShowOverview(false);
      setEpochRange(undefined);
      jumpRequestIdRef.current += 1;
      setJumpToEvent({ event, requestId: jumpRequestIdRef.current, openDetail });
    },
    [setContinent, setPersistedCategories],
  );

  const handleSearchSelectEvent = useCallback(
    (event: TimelineEvent) => focusEvent(event, true),
    [focusEvent],
  );

  // Search result → bare year: just center the viewport, no filter changes.
  const handleSearchSelectYear = useCallback((year: number) => {
    setShowOverview(false);
    setEpochRange(undefined);
    jumpRequestIdRef.current += 1;
    setJumpToYear({ year, requestId: jumpRequestIdRef.current });
  }, []);

  // --- Guided learning journey ---------------------------------------------
  const activeJourney = activeJourneyId ? journeyById(activeJourneyId) : undefined;
  const journeySteps = useMemo(
    () => (activeJourney ? resolveJourneySteps(activeJourney, ALL_EVENTS) : []),
    [activeJourney],
  );
  // Clamped so a shrunken/curated-down journey can never strand a stored index
  // past its last station.
  const journeyStep = activeJourneyId
    ? Math.min(journeyProgress[activeJourneyId] ?? 0, Math.max(0, journeySteps.length - 1))
    : 0;
  const journeyEvent = journeySteps[journeyStep] ?? null;

  // Starting a journey resumes at its stored station. The steps are resolved
  // locally here rather than read from `journeySteps` because `activeJourneyId`
  // is only set in this same call — the memo still holds the previous journey.
  const handleStartJourney = useCallback(
    (journeyId: string) => {
      const journey = journeyById(journeyId);
      if (!journey) return;
      const steps = resolveJourneySteps(journey, ALL_EVENTS);
      if (steps.length === 0) return;
      const index = Math.min(journeyProgress[journeyId] ?? 0, steps.length - 1);
      setActiveJourneyId(journeyId);
      setShowOverview(false);
      const target = steps[index];
      if (target) focusEvent(target, false);
    },
    [journeyProgress, focusEvent],
  );

  // Station changes drive the timeline directly from the handler (rather than
  // via an effect on the current station, which would cascade renders).
  const goToJourneyStep = useCallback(
    (next: number) => {
      if (!activeJourneyId) return;
      const clamped = Math.max(0, Math.min(next, journeySteps.length - 1));
      setJourneyProgress((prev) => ({ ...prev, [activeJourneyId]: clamped }));
      const target = journeySteps[clamped];
      if (target) focusEvent(target, false);
    },
    [activeJourneyId, journeySteps, setJourneyProgress, focusEvent],
  );

  const handleJourneyNext = useCallback(
    () => goToJourneyStep(journeyStep + 1),
    [journeyStep, goToJourneyStep],
  );
  const handleJourneyPrev = useCallback(
    () => goToJourneyStep(journeyStep - 1),
    [journeyStep, goToJourneyStep],
  );

  const handleJourneyExit = useCallback(() => {
    // Finishing the last station completes the journey: drop the stored index
    // so the landing page offers a fresh start instead of "continue at the end".
    if (activeJourneyId && journeyStep >= journeySteps.length - 1) {
      setJourneyProgress((prev) => {
        const next = { ...prev };
        delete next[activeJourneyId];
        return next;
      });
    }
    setActiveJourneyId(null);
  }, [activeJourneyId, journeyStep, journeySteps.length, setJourneyProgress]);

  // Leaving the timeline for the landing page also leaves the journey mode.
  const isJourneyActive = activeJourneyId !== null && !showOverview;

  // #212: the filter icon's badge is quantitative ("n/m") and only shown when
  // the selection deviates from the default — otherwise it would be
  // permanent noise and lose its signal value.
  const isDefaultCategorySelection = useMemo(() => {
    if (persistedCategories.length !== DEFAULT_CATEGORIES.length) return false;
    const defaults = new Set(DEFAULT_CATEGORIES);
    return persistedCategories.every((c) => defaults.has(c));
  }, [persistedCategories]);
  const showFilterBadge = !isDefaultCategorySelection || cultureFilter !== null;
  const filterBadgeLabel = `${activeCategories.size}/${CHIP_CATEGORIES.length}`;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      {showOverview ? (
        <>
          <EpochOverviewScreen
            onSelectEpoch={handleSelectEpoch}
            onShowFullTimeline={handleShowFullTimeline}
            onOpenSettings={handleOpenSettings}
            onOpenSearch={handleOpenSearch}
            onOpenFilters={handleOpenFilterSheet}
            filterBadgeLabel={showFilterBadge ? filterBadgeLabel : undefined}
            onStartJourney={handleStartJourney}
            journeyProgress={journeyProgress}
          />
          <DetailLevelPrompt
            visible={!detailPromptSeen}
            onOpenSettings={handleOpenSettingsFromPrompt}
            onDismiss={handleDismissDetailPrompt}
          />
        </>
      ) : (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <Pressable
              style={styles.headerText}
              onPress={handleHomePress}
              accessibilityRole="button"
              accessibilityLabel={t('epochNav.title')}
              accessibilityHint={t('epochNav.homeHint')}
            >
              <Text style={styles.title}>{t('app.title')}</Text>
              <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={handleOpenSearch}
              accessibilityLabel={t('search.title')}
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>🔍</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={handleOpenFilterSheet}
              accessibilityLabel={
                showFilterBadge
                  ? t('filterSheet.iconLabelActive', { badge: filterBadgeLabel })
                  : t('filterSheet.iconLabel')
              }
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>🏷</Text>
              {showFilterBadge && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{filterBadgeLabel}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={handleOpenSettings}
              accessibilityLabel={t('settings.title')}
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>⚙</Text>
            </Pressable>
          </View>
          <View
            style={styles.canvasOuter}
            onStartShouldSetResponderCapture={() => {
              zoomClusterRef.current?.wake();
              return false;
            }}
          >
            <ScrollView
              ref={canvasScrollRef}
              style={styles.canvasWrap}
              contentContainerStyle={styles.canvasContent}
            >
              <TimelineView
                ref={timelineViewRef}
                activeCategories={activeCategories}
                continent={continent}
                culture={cultureFilter}
                detailLevel={detailLevel}
                onSelectEvent={setSelected}
                epochRange={epochRange}
                jumpToEvent={jumpToEvent}
                jumpToYear={jumpToYear}
                showFpsMonitor={showFpsMonitor}
                scrollRef={canvasScrollRef}
              />
            </ScrollView>
            {/* Rendered outside the ScrollView so the buttons stay pinned to the
                viewport instead of scrolling away with tall lane content.
                Hidden during a guided journey: the journey bar occupies the
                bottom of the screen and drives navigation itself. */}
            {!isJourneyActive && (
              <TimelineZoomCluster
                ref={zoomClusterRef}
                jumpToToday={() => timelineViewRef.current?.jumpToToday()}
                zoomIn={() => timelineViewRef.current?.zoomIn()}
                zoomOut={() => timelineViewRef.current?.zoomOut()}
              />
            )}
            {isJourneyActive && activeJourney && (
              <LearningJourneyBar
                journeyLabelKey={activeJourney.labelKey}
                event={journeyEvent}
                stepIndex={journeyStep}
                stepCount={journeySteps.length}
                onPrev={handleJourneyPrev}
                onNext={handleJourneyNext}
                onExit={handleJourneyExit}
              />
            )}
          </View>
          <ContinentTabBar
            active={continent}
            onChange={handleContinentChange}
            onPressActive={handleOpenFilterSheet}
            cultureFilterActive={cultureFilter !== null}
          />
          <EventDetailModal event={selected} onClose={() => setSelected(null)} />
        </SafeAreaView>
      )}
      <SettingsModal
        visible={settingsVisible}
        onClose={handleCloseSettings}
        detailLevel={detailLevel}
        onDetailLevelChange={setDetailLevel}
        showFpsMonitor={showFpsMonitor}
        onShowFpsMonitorChange={setShowFpsMonitor}
      />
      <SearchModal
        visible={searchVisible}
        onClose={handleCloseSearch}
        onSelectEvent={handleSearchSelectEvent}
        onSelectYear={handleSearchSelectYear}
      />
      <FilterSheet
        visible={filterSheetVisible}
        onClose={handleCloseFilterSheet}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        continent={continent}
        cultures={availableCultures}
        activeCulture={cultureFilter}
        onSelectCulture={setCultureFilter}
      />
    </>
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
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
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
      marginLeft: spacing.xs,
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
    canvasOuter: {
      flex: 1,
    },
    canvasWrap: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    canvasContent: {
      flexGrow: 1,
    },
  });
}
