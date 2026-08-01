import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ZoomLevel } from '@/data/schema';
import { epochPathForViewport } from '@/timeline/epoch';
import { formatEventYear } from '@/timeline/formatYear';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Props = {
  startYear: number;
  endYear: number;
  zoomLevel: ZoomLevel;
  /** Zoom the viewport to a range — wired to `zoomToFit` by both renderers. */
  onJump: (startYear: number, endYear: number | null | undefined) => void;
};

/**
 * The single "where am I" control of the timeline. Shows the current zoom band,
 * the epoch path resolved from the viewport (Menschheit › Antike › Hellenismus)
 * and the visible year range, in one row.
 *
 * Each crumb is tappable and zooms back out to that ancestor, which is what lets
 * this one component replace the former epoch chip bar, the prev/next epoch
 * arrows and the separate zoom-level pill.
 *
 * Lives in the canvas chrome, so it uses the static dark `tokens` palette rather
 * than `useTheme()` — the canvas stays dark in both themes.
 */
export function EpochBreadcrumbBar({ startYear, endYear, zoomLevel, onJump }: Props) {
  const { t } = useTranslation();

  // Recomputed on every viewport mirror update (5 px pan threshold) — keep cheap.
  const path = useMemo(() => epochPathForViewport(startYear, endYear), [startYear, endYear]);

  const range = `${formatEventYear(startYear, t)} – ${formatEventYear(endYear, t)}`;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <View style={styles.zoomPill} pointerEvents="none">
          <Text style={styles.zoomText} numberOfLines={1}>
            {t(`zoom.level.${zoomLevel}`)}
          </Text>
        </View>

        {path.map((epoch, i) => {
          const isLast = i === path.length - 1;
          return (
            <React.Fragment key={epoch.key}>
              {i > 0 && <Text style={styles.separator}>›</Text>}
              <Pressable
                style={({ pressed }) => [styles.crumb, pressed && styles.crumbPressed]}
                onPress={() => onJump(epoch.startYear, epoch.endYear)}
                accessibilityRole="button"
                accessibilityLabel={t(`epochNav.${epoch.key}`)}
                accessibilityHint={t('epochNav.jumpHint')}
              >
                <View style={[styles.dot, { backgroundColor: epoch.color }]} />
                <Text
                  style={[styles.crumbText, isLast ? styles.crumbCurrent : styles.crumbAncestor]}
                  numberOfLines={1}
                >
                  {t(`epochNav.${epoch.key}`)}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}

        <Text style={styles.separator}>·</Text>
        <Text style={styles.range} numberOfLines={1}>
          {range}
        </Text>
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
    gap: 4,
  },
  zoomPill: {
    backgroundColor: 'rgba(31, 36, 45, 0.88)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(42, 49, 60, 0.7)',
    marginRight: 2,
  },
  zoomText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  crumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  crumbPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  crumbText: {
    ...typography.caption,
    fontSize: 11,
  },
  crumbCurrent: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  crumbAncestor: {
    color: colors.textSecondary,
  },
  separator: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.5,
  },
  range: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
