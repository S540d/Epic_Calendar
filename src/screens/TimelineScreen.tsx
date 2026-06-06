import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ContinentTabBar } from '@/components/ContinentTabBar';
import { FilterChipBar } from '@/components/FilterChipBar';
import { TimelineView } from '@/components/TimelineView';
import { EventDetailModal } from '@/screens/EventDetailModal';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { Continent, TimelineEvent } from '@/data/schema';
import { colors, spacing, typography, type Category } from '@/theme/tokens';

const DEFAULT_CATEGORIES: Category[] = ['erdzeitalter', 'zivilisation'];

export function TimelineScreen() {
  const { t, i18n } = useTranslation();

  const [persistedCategories, setPersistedCategories] = usePersistedState<Category[]>(
    'activeCategories',
    DEFAULT_CATEGORIES,
  );
  const activeCategories = new Set<Category>(persistedCategories);

  const [continent, setContinent] = usePersistedState<Continent>('selectedContinent', 'europa');
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const toggleCategory = (cat: Category) => {
    setPersistedCategories((prev) => {
      const set = new Set(prev);
      if (set.has(cat)) set.delete(cat);
      else set.add(cat);
      return Array.from(set);
    });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'de' ? 'en' : 'de');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('app.title')}</Text>
          <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
        </View>
        <Pressable
          style={styles.langToggle}
          onPress={toggleLanguage}
          accessibilityLabel="Sprache wechseln"
          accessibilityRole="button"
        >
          <Text style={styles.langToggleText}>
            {i18n.language === 'de' ? 'EN' : 'DE'}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}
          onPress={() => setResetKey((k) => k + 1)}
          accessibilityLabel="Zur Übersicht zurücksetzen"
          accessibilityRole="button"
        >
          <Text style={styles.homeButtonText}>⌂</Text>
        </Pressable>
      </View>
      <FilterChipBar active={activeCategories} onToggle={toggleCategory} />
      <ScrollView style={styles.canvasWrap} contentContainerStyle={styles.canvasContent}>
        <TimelineView
          activeCategories={activeCategories}
          continent={continent}
          onSelectEvent={setSelected}
          resetKey={resetKey}
        />
      </ScrollView>
      <ContinentTabBar active={continent} onChange={setContinent} />
      <EventDetailModal event={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  langToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  langToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonPressed: {
    backgroundColor: colors.bgElevated,
  },
  homeButtonText: {
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
