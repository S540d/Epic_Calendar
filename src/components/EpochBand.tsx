import React from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { yearToT } from '@/timeline/scale';
import { EPOCHS } from '@/timeline/epochs';
import { colors, typography } from '@/theme/tokens';

export const EPOCH_BAND_HEIGHT = 22;

type Props = {
  /** T value mapped to pixel 0 of the band's coordinate space (== container start). */
  offsetAtZero: number;
  pixelsPerUnit: number;
  /** Total band width in px (same as the scrollable canvas width). */
  width: number;
  /** Jump-to-epoch on tap. */
  onJump: (startYear: number, endYear: number | null | undefined) => void;
};

/**
 * Coloured, clickable epoch segments rendered just below the time axis, inside
 * the horizontally-scrolling canvas so they line up with the events and scroll
 * along. Tapping a segment zooms the viewport to that epoch.
 */
export function EpochBand({ offsetAtZero, pixelsPerUnit, width, onJump }: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.band, { width }]} pointerEvents="box-none">
      {EPOCHS.map((ep) => {
        const x = (yearToT(ep.startYear) - offsetAtZero) * pixelsPerUnit;
        const w = Math.max(2, (yearToT(ep.endYear) - yearToT(ep.startYear)) * pixelsPerUnit);
        // Skip segments fully off-canvas to keep the DOM light.
        if (x + w < 0 || x > width) return null;
        return (
          <Pressable
            key={ep.key}
            onPress={() => onJump(ep.startYear, ep.endYear)}
            accessibilityRole="button"
            accessibilityLabel={t(`epochNav.${ep.key}`)}
            style={[
              styles.segment,
              { left: x, width: w, backgroundColor: ep.color + '44', borderColor: ep.color },
            ]}
          >
            <Text style={styles.label} numberOfLines={1}>
              {t(`epochNav.${ep.key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    height: EPOCH_BAND_HEIGHT,
    position: 'relative',
    backgroundColor: colors.bg,
  },
  segment: {
    position: 'absolute',
    top: 0,
    height: EPOCH_BAND_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
    overflow: 'hidden',
    cursor: 'pointer' as any,
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
