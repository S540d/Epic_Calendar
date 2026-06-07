import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ZoomLevel } from '@/data/schema';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Props = {
  zoomLevel: ZoomLevel;
};

/**
 * Persistent, non-interactive pill showing the current LOD band
 * (Äonen → Ären → Epochen → Jahrhunderte → Jahre) so users always know
 * how deep they are zoomed without decoding the axis ticks.
 */
export function ZoomLevelIndicator({ zoomLevel }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.pill} pointerEvents="none">
      <Text style={styles.text} numberOfLines={1}>
        {t(`zoom.level.${zoomLevel}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 6,
    left: 8,
    backgroundColor: 'rgba(31, 36, 45, 0.88)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(42, 49, 60, 0.7)',
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
