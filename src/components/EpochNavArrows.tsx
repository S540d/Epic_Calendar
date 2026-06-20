import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NAVIGATION_EPOCHS, type NavigationEpoch } from '@/timeline/epoch';
import { colors, typography } from '@/theme/tokens';

const EPOCH_COLORS: Record<string, string> = {
  cosmicDawn: '#6B4BB8',
  earlyEarth: '#4A8FA8',
  paleozoic: '#4FA86A',
  mesozoic: '#B87C3A',
  cenozoic: '#7C9CFF',
  humanHistory: '#C28B4A',
  stoneAge: '#8E9E6A',
  ancientCiv: '#B88B4A',
  antiquity: '#C28B4A',
  middleAges: '#A07040',
  modern: '#CF8A30',
};

const ALL_EPOCHS: NavigationEpoch[] = NAVIGATION_EPOCHS.flatMap((ep) =>
  ep.children?.length ? [ep, ...ep.children] : [ep],
);

type Props = {
  visibleStartYear: number;
  visibleEndYear: number;
  onJump: (startYear: number, endYear: number | null | undefined) => void;
};

export function EpochNavArrows({ visibleStartYear, visibleEndYear, onJump }: Props) {
  const { t } = useTranslation();

  const leftEpoch =
    ALL_EPOCHS.filter((ep) => ep.endYear <= visibleStartYear).sort(
      (a, b) => b.endYear - a.endYear,
    )[0] ?? null;

  const rightEpoch =
    ALL_EPOCHS.filter((ep) => ep.startYear >= visibleEndYear).sort(
      (a, b) => a.startYear - b.startYear,
    )[0] ?? null;

  if (!leftEpoch && !rightEpoch) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {leftEpoch && (
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.arrow,
            styles.arrowLeft,
            pressed && styles.pressed,
          ]}
          onPress={() => onJump(leftEpoch.startYear, leftEpoch.endYear)}
          accessibilityRole="button"
          accessibilityLabel={t(`epochNav.${leftEpoch.key}`)}
        >
          <Text style={styles.arrowIcon}>◀</Text>
          <View
            style={[styles.dot, { backgroundColor: EPOCH_COLORS[leftEpoch.key] ?? colors.accent }]}
          />
          <Text style={styles.arrowLabel} numberOfLines={2}>
            {t(`epochNav.${leftEpoch.key}`)}
          </Text>
        </Pressable>
      )}
      {rightEpoch && (
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.arrow,
            styles.arrowRight,
            pressed && styles.pressed,
          ]}
          onPress={() => onJump(rightEpoch.startYear, rightEpoch.endYear)}
          accessibilityRole="button"
          accessibilityLabel={t(`epochNav.${rightEpoch.key}`)}
        >
          <Text style={styles.arrowLabel} numberOfLines={2}>
            {t(`epochNav.${rightEpoch.key}`)}
          </Text>
          <View
            style={[styles.dot, { backgroundColor: EPOCH_COLORS[rightEpoch.key] ?? colors.accent }]}
          />
          <Text style={styles.arrowIcon}>▶</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 17, 22, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    maxWidth: 88,
    gap: 4,
  },
  arrowLeft: {
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  arrowRight: {
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  pressed: { opacity: 0.65 },
  arrowIcon: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  arrowLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
});
