import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  // Incrementing this value triggers the animated home-view reset in TimelineView
  const [resetKey, setResetKey] = useState(0);

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
        <View>
          <Text style={styles.title}>Epic Calendar</Text>
          <Text style={styles.subtitle}>Zoome & wische durch die Geschichte</Text>
        </View>
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
      {/* Vertical ScrollView so all lanes are reachable on small screens */}
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
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
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
