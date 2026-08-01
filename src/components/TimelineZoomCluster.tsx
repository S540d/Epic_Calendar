import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { timelineStyles as styles } from './timelineRenderShared';

type Props = {
  jumpToToday: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

/**
 * Floating zoom controls pinned to the bottom-right of the canvas:
 * jump-to-today, zoom in, zoom out.
 *
 * Shared by both renderers. `styles.zoomButtons` already carries the absolute
 * positioning, so no platform-specific override is needed — the web renderer
 * previously repeated `position/right/bottom` through a `Platform.select` that
 * set exactly the values the base style already had.
 */
export function TimelineZoomCluster({ jumpToToday, zoomIn, zoomOut }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.zoomButtons} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.zoomBtn}
        onPress={jumpToToday}
        accessibilityLabel={t('axis.today')}
      >
        <Text style={styles.zoomBtnText}>⌖</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} accessibilityLabel="Zoom in">
        <Text style={styles.zoomBtnText}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} accessibilityLabel="Zoom out">
        <Text style={styles.zoomBtnText}>−</Text>
      </TouchableOpacity>
    </View>
  );
}
