import React, { useState } from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NAVIGATION_EPOCHS, type NavigationEpoch } from '@/timeline/epoch';
import { colors, typography } from '@/theme/tokens';

type Props = {
  onJump: (startYear: number, endYear: number | null | undefined) => void;
};

/**
 * Two-level horizontal chip bar for fast epoch navigation within the timeline.
 * Level 0: top-level NAVIGATION_EPOCHS. Tapping an epoch with children (humanHistory)
 * zooms to its range and reveals its sub-epoch chips. "← Back" returns to level 0.
 */
export function EpochChipBar({ onJump }: Props) {
  const { t } = useTranslation();
  const [drillDown, setDrillDown] = useState<NavigationEpoch | null>(null);

  const chips: readonly NavigationEpoch[] = drillDown
    ? (drillDown.children ?? [])
    : NAVIGATION_EPOCHS;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {drillDown && (
          <Pressable
            style={[styles.chip, styles.backChip]}
            onPress={() => setDrillDown(null)}
            accessibilityRole="button"
            accessibilityLabel={t('epochNav.back')}
          >
            <Text style={styles.chipText}>{t('epochNav.back')}</Text>
          </Pressable>
        )}
        {chips.map((ep) => {
          const hasChildren = (ep.children?.length ?? 0) > 0;
          return (
            <Pressable
              key={ep.key}
              style={styles.chip}
              onPress={() => {
                onJump(ep.startYear, ep.endYear);
                if (hasChildren) setDrillDown(ep);
              }}
              accessibilityRole="button"
              accessibilityLabel={t(`epochNav.${ep.key}`)}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {t(`epochNav.${ep.key}`)}
                {hasChildren ? ' ▸' : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backChip: {
    borderColor: colors.accent + '80',
  },
  chipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textPrimary,
  },
});
