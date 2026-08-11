import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ContinentTabBar } from '@/components/ContinentTabBar';
import { DetailLevelPrompt } from '@/components/DetailLevelPrompt';
import { EpochOverviewScreen } from '@/components/EpochOverviewScreen';
import { FilterChipBar } from '@/components/FilterChipBar';
import { SearchModal } from '@/components/SearchModal';
import { SettingsModal } from '@/components/SettingsModal';
import { TimelineView, type TimelineViewHandle } from '@/components/TimelineView';
import { TimelineZoomCluster } from '@/components/TimelineZoomCluster';
import { EventDetailModal } from '@/screens/EventDetailModal';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { Continent, ImportanceLevel, TimelineEvent } from '@/data/schema';
import { spacing, typography, type Category } from '@/theme/tokens';
import { DEFAULT_CATEGORIES } from '@/theme/categories';
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
  const [epochRange, setEpochRange] = useState<{ startYear: number; endYear: number } | undefined>(
    undefined,
  );
  const canvasScrollRef = useRef<ScrollView>(null);
  const timelineViewRef = useRef<TimelineViewHandle>(null);
  const [jumpToEvent, setJumpToEvent] = useState<
    { event: TimelineEvent; requestId: number } | undefined
  >(undefined);
  const [jumpToYear, setJumpToYear] = useState<{ year: number; requestId: number } | undefined>(
    undefined,
  );
  const jumpRequestIdRef = useRef(0);

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
  }, []);

  const handleOpenSettings = useCallback(() => setSettingsVisible(true), []);
  const handleCloseSettings = useCallback(() => setSettingsVisible(false), []);
  const handleOpenSearch = useCallback(() => setSearchVisible(true), []);
  const handleCloseSearch = useCallback(() => setSearchVisible(false), []);

  const handleDismissDetailPrompt = useCallback(() => setDetailPromptSeen(true), [
    setDetailPromptSeen,
  ]);
  const handleOpenSettingsFromPrompt = useCallback(() => {
    setDetailPromptSeen(true);
    setSettingsVisible(true);
  }, [setDetailPromptSeen]);

  // Search result → event: ensure the event's category and continent are
  // active so the jump target is actually visible, then leave the overview
  // and trigger the zoom-to-fit + detail-modal jump in TimelineView (#146 A).
  const handleSearchSelectEvent = useCallback(
    (event: TimelineEvent) => {
      setPersistedCategories((prev) =>
        prev.includes(event.category) ? prev : [...prev, event.category],
      );
      if (event.continent !== 'global') {
        setContinent(event.continent);
      }
      setShowOverview(false);
      setEpochRange(undefined);
      jumpRequestIdRef.current += 1;
      setJumpToEvent({ event, requestId: jumpRequestIdRef.current });
    },
    [setContinent, setPersistedCategories],
  );

  // Search result → bare year: just center the viewport, no filter changes.
  const handleSearchSelectYear = useCallback((year: number) => {
    setShowOverview(false);
    setEpochRange(undefined);
    jumpRequestIdRef.current += 1;
    setJumpToYear({ year, requestId: jumpRequestIdRef.current });
  }, []);

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
              onPress={handleOpenSettings}
              accessibilityLabel={t('settings.title')}
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>⚙</Text>
            </Pressable>
          </View>
          <FilterChipBar active={activeCategories} onToggle={toggleCategory} />
          <View style={styles.canvasOuter}>
            <ScrollView
              ref={canvasScrollRef}
              style={styles.canvasWrap}
              contentContainerStyle={styles.canvasContent}
            >
              <TimelineView
                ref={timelineViewRef}
                activeCategories={activeCategories}
                continent={continent}
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
                viewport instead of scrolling away with tall lane content. */}
            <TimelineZoomCluster
              jumpToToday={() => timelineViewRef.current?.jumpToToday()}
              zoomIn={() => timelineViewRef.current?.zoomIn()}
              zoomOut={() => timelineViewRef.current?.zoomOut()}
            />
          </View>
          <ContinentTabBar active={continent} onChange={setContinent} />
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
