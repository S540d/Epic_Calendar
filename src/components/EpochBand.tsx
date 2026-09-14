import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tToYear, yearToT } from '@/timeline/scale';
import { epochBandDepth, epochPathForViewport, epochsAtDepthCached } from '@/timeline/epoch';
import { colors, radii, typography } from '@/theme/tokens';

export const EPOCH_BAND_HEIGHT = 22;

/** Max width of the ancestor prefix chip before it scrolls internally. */
const ANCESTOR_CHIP_MAX_WIDTH = 130;

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
 *
 * The band refines itself with the zoom: it renders the deepest level of the
 * epoch tree whose segments are still wide enough to read, so panning through
 * the Middle Ages shows its sub-epochs while a view of the whole Earth's
 * history shows only the eras.
 *
 * A small ancestor prefix chip (#213, folding the former `EpochBreadcrumbBar`
 * into this component) sits over the band's left edge and shows the levels
 * *above* the one the band itself renders — e.g. "Menschheit ›" while the band
 * shows "Antike"/"Mittelalter" segments — so the navigation path stays
 * reachable without a whole separate row. It only claims its own (narrow)
 * width; taps outside it fall through to the segment underneath.
 */
export function EpochBand({ offsetAtZero, pixelsPerUnit, width, onJump }: Props) {
  const { t } = useTranslation();

  const depth = useMemo(() => epochBandDepth(width / pixelsPerUnit), [width, pixelsPerUnit]);
  const epochs = useMemo(() => epochsAtDepthCached(depth), [depth]);

  const ancestorPath = useMemo(() => {
    const startYear = tToYear(offsetAtZero);
    const endYear = tToYear(offsetAtZero + width / pixelsPerUnit);
    const fullPath = epochPathForViewport(startYear, endYear);
    // The band itself already renders the epochs at `depth` — only the levels
    // above that are missing from the view and need the prefix chip.
    return fullPath.slice(0, depth);
  }, [offsetAtZero, pixelsPerUnit, width, depth]);

  return (
    <View style={[styles.band, { width }]} pointerEvents="box-none">
      {epochs.map((ep) => {
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

      {ancestorPath.length > 0 && (
        <View style={styles.ancestorWrapper} pointerEvents="box-none">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.ancestorScroll}
            contentContainerStyle={styles.ancestorRow}
          >
            {ancestorPath.map((epoch) => (
              <Pressable
                key={epoch.key}
                onPress={() => onJump(epoch.startYear, epoch.endYear)}
                accessibilityRole="button"
                accessibilityLabel={t(`epochNav.${epoch.key}`)}
                accessibilityHint={t('epochNav.jumpHint')}
                style={({ pressed }) => [styles.ancestorCrumb, pressed && styles.ancestorPressed]}
              >
                <Text style={styles.ancestorText} numberOfLines={1}>
                  {t(`epochNav.${epoch.key}`)} ›
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
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
  ancestorWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: EPOCH_BAND_HEIGHT,
    maxWidth: ANCESTOR_CHIP_MAX_WIDTH,
  },
  ancestorScroll: {
    height: EPOCH_BAND_HEIGHT,
  },
  ancestorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: EPOCH_BAND_HEIGHT,
    backgroundColor: 'rgba(15, 18, 24, 0.92)',
    borderRadius: radii.pill,
    paddingHorizontal: 6,
  },
  ancestorCrumb: {
    paddingHorizontal: 4,
  },
  ancestorPressed: {
    opacity: 0.6,
  },
  ancestorText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
