import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ContinentTabBar } from '@/components/ContinentTabBar';
import { EpochOverviewScreen } from '@/components/EpochOverviewScreen';
import { FilterChipBar } from '@/components/FilterChipBar';
import { SettingsModal } from '@/components/SettingsModal';
import { TimelineView } from '@/components/TimelineView';
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
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [showOverview, setShowOverview] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [epochRange, setEpochRange] = useState<{ startYear: number; endYear: number } | undefined>(
    undefined,
  );

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

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      {showOverview ? (
        <EpochOverviewScreen
          onSelectEpoch={handleSelectEpoch}
          onShowFullTimeline={handleShowFullTimeline}
          onOpenSettings={handleOpenSettings}
        />
      ) : (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <Pressable
              style={styles.headerText}
              onPress={handleHomePress}
              accessibilityRole="button"
              accessibilityLabel={t('app.title')}
            >
              <Text style={styles.title}>{t('app.title')}</Text>
              <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={handleOpenSettings}
              accessibilityLabel={t('settings.title')}
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>⚙</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={handleHomePress}
              accessibilityLabel={t('epochNav.title')}
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>⌂</Text>
            </Pressable>
          </View>
          <FilterChipBar active={activeCategories} onToggle={toggleCategory} />
          <ScrollView style={styles.canvasWrap} contentContainerStyle={styles.canvasContent}>
            <TimelineView
              activeCategories={activeCategories}
              continent={continent}
              detailLevel={detailLevel}
              onSelectEvent={setSelected}
              epochRange={epochRange}
            />
          </ScrollView>
          <ContinentTabBar active={continent} onChange={setContinent} />
          <EventDetailModal event={selected} onClose={() => setSelected(null)} />
        </SafeAreaView>
      )}
      <SettingsModal
        visible={settingsVisible}
        onClose={handleCloseSettings}
        detailLevel={detailLevel}
        onDetailLevelChange={setDetailLevel}
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
    canvasWrap: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    canvasContent: {
      flexGrow: 1,
    },
  });
}
