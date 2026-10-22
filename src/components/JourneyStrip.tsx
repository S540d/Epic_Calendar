import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TimelineEvent } from '@/data/schema';
import { formatEventYear } from '@/timeline/formatYear';
import { layoutJourneyStrip } from '@/timeline/journeyStrip';
import { CATEGORY_COLORS } from '@/theme/categories';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/tokens';

type Props = {
  events: readonly TimelineEvent[];
  /** 0-based index of the current station. */
  stepIndex: number;
  onSelectStep: (index: number) => void;
};

const DOT = 10;
const DOT_ACTIVE = 16;

/**
 * Mini-timeline over the whole journey: one marker per station, span derived
 * from the stations (earliest → latest), tap a marker to jump to that station.
 * Keeps the overview that is lost when only stepping from one event to the next.
 */
export function JourneyStrip({ events, stepIndex, onSelectStep }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const layout = useMemo(() => layoutJourneyStrip(events), [events]);

  if (!layout || events.length < 2) return null;

  return (
    <View style={styles.root}>
      <View style={styles.track}>
        <View style={styles.line} />
        {events.map((ev, i) => {
          const active = i === stepIndex;
          const size = active ? DOT_ACTIVE : DOT;
          return (
            <Pressable
              key={ev.id}
              onPress={() => onSelectStep(i)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('learning.jumpToStation', { current: i + 1, title: ev.title })}
              accessibilityState={{ selected: active }}
              style={[
                styles.dot,
                {
                  left: `${(layout.positions[i] ?? 0) * 100}%`,
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  backgroundColor: CATEGORY_COLORS[ev.category],
                  borderColor: active ? colors.textPrimary : colors.bgElevated,
                  opacity: active || i < stepIndex ? 1 : 0.55,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>{formatEventYear(layout.startYear, t)}</Text>
        <Text style={styles.label}>{formatEventYear(layout.endYear, t)}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
    track: {
      height: DOT_ACTIVE + 4,
      marginHorizontal: DOT_ACTIVE / 2,
      justifyContent: 'center',
    },
    line: {
      height: 2,
      borderRadius: radii.pill,
      backgroundColor: colors.border,
    },
    dot: {
      position: 'absolute',
      top: '50%',
      borderRadius: DOT_ACTIVE,
      borderWidth: 2,
    },
    labels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
    },
  });
}
