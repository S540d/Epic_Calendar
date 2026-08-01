import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { ZoomLevel } from '@/data/schema';
import { EpochBand } from './EpochBand';
import { EpochBreadcrumbBar } from './EpochBreadcrumbBar';
import { FpsMonitor } from './FpsMonitor';
import { TimeAxis } from './TimeAxis';
import { TimelineMinimap } from './TimelineMinimap';
import { LANE_LABEL_WIDTH } from '@/theme/tokens';
import { timelineStyles as styles } from './timelineRenderShared';

type Props = {
  jsOffsetX: number;
  jsPixelsPerUnit: number;
  canvasWidth: number;
  zoomLevel: ZoomLevel;
  viewportRange: { startYear: number; endYear: number };
  zoomToFit: (startYear: number, endYear: number | null | undefined) => void;
  handleMinimapJump: (newOffsetX: number) => void;
  minimapHighlight?: { startT: number; endT: number } | null;
  showFpsMonitor?: boolean;
};

/**
 * The fixed header stack above the lane area: time axis (+ FPS overlay),
 * minimap, epoch band and breadcrumb bar.
 *
 * Shared by both renderers. These rows are pure React Native views with no
 * Skia or DOM specifics, so keeping one copy removes the main way the web and
 * native renderers used to drift apart — previously every change here had to be
 * made twice, in two ~400-line files, with only the type-checker to catch a
 * one-sided edit.
 *
 * The `position: sticky` on the axis row is a web-only concern, but the
 * `Platform.select` has no `default` branch and therefore resolves to
 * `undefined` on native — so it can live here unconditionally.
 */
export function TimelineChrome({
  jsOffsetX,
  jsPixelsPerUnit,
  canvasWidth,
  zoomLevel,
  viewportRange,
  zoomToFit,
  handleMinimapJump,
  minimapHighlight,
  showFpsMonitor = false,
}: Props) {
  return (
    <>
      <View
        style={[
          styles.axisRow,
          Platform.select({ web: { position: 'sticky', top: 0, zIndex: 10 } as any }),
        ]}
      >
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <TimeAxis
          offsetX={jsOffsetX}
          pixelsPerUnit={jsPixelsPerUnit}
          canvasWidth={canvasWidth}
          zoomLevel={zoomLevel}
        />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.topRightGroup}>
            <FpsMonitor enabled={showFpsMonitor} />
          </View>
        </View>
      </View>

      <TimelineMinimap
        offsetX={jsOffsetX}
        pixelsPerUnit={jsPixelsPerUnit}
        canvasWidth={canvasWidth}
        onJump={handleMinimapJump}
        highlightRange={minimapHighlight}
      />

      <View style={styles.epochBandRow}>
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <View style={{ width: canvasWidth, overflow: 'hidden' }}>
          <EpochBand
            offsetAtZero={jsOffsetX}
            pixelsPerUnit={jsPixelsPerUnit}
            width={canvasWidth}
            onJump={zoomToFit}
          />
        </View>
      </View>

      <EpochBreadcrumbBar
        startYear={viewportRange.startYear}
        endYear={viewportRange.endYear}
        zoomLevel={zoomLevel}
        onJump={zoomToFit}
      />
    </>
  );
}
