import React from 'react';
import { Platform, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANE_LABEL_WIDTH, colors, type Category } from '@/theme/tokens';
import { laneHeightForTracks, timelineStyles as styles } from './timelineRenderShared';

type Props = {
  lanes: Category[];
  laneTops: number[];
  laneTrackCounts: Map<Category, number>;
  overflowCounts: Map<Category, number>;
};

/**
 * The category-label column on the left edge of the canvas. Labels are rendered
 * upright inside a rotated inner view (−90°) so the column only costs
 * `LANE_LABEL_WIDTH` px; lanes whose events exceed `MAX_EVENTS_PER_LANE` get a
 * "+n" cluster badge.
 *
 * Shared by both renderers — the column is plain React Native either way. The
 * `position: sticky` is web-only but resolves to `undefined` on native (no
 * `default` branch), so it needs no platform fork here.
 */
export function TimelineLaneLabels({ lanes, laneTops, laneTrackCounts, overflowCounts }: Props) {
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.labels,
        Platform.select({ web: { position: 'sticky', left: 0, zIndex: 5 } as any }),
      ]}
    >
      {lanes.map((cat, idx) => {
        const overflow = overflowCounts.get(cat) ?? 0;
        const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
        return (
          <View
            key={cat}
            style={[
              styles.label,
              {
                top: laneTops[idx],
                height: laneH,
                borderLeftColor: colors.category[cat],
              },
            ]}
          >
            <View
              style={{
                width: laneH,
                height: LANE_LABEL_WIDTH,
                transform: [{ rotate: '-90deg' }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={styles.labelText} numberOfLines={1}>
                {t(`category.${cat}`)}
              </Text>
            </View>
            {overflow > 0 && <Text style={styles.clusterBadge}>+{overflow}</Text>}
          </View>
        );
      })}
    </View>
  );
}
