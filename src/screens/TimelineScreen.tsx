import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContinentTabBar } from '@/components/ContinentTabBar';
import { FilterChipBar } from '@/components/FilterChipBar';
import { TimelineView } from '@/components/TimelineView';
import { EventDetailModal } from '@/screens/EventDetailModal';
import type { Continent, TimelineEvent } from '@/data/schema';
import { colors, spacing, typography, type Category } from '@/theme/tokens';

export function TimelineScreen() {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(
    new Set<Category>(['erdzeitalter', 'zivilisation']),
  );
  const [continent, setContinent] = useState<Continent>('europa');
  const [selected, setSelected] = useState<TimelineEvent | null>(null);

  const toggleCategory = (cat: Category) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Epic Calendar</Text>
        <Text style={styles.subtitle}>Zoome & wische durch die Geschichte</Text>
      </View>
      <FilterChipBar active={activeCategories} onToggle={toggleCategory} />
      <View style={styles.canvasWrap}>
        <TimelineView
          activeCategories={activeCategories}
          continent={continent}
          onSelectEvent={setSelected}
        />
      </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
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
  canvasWrap: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
