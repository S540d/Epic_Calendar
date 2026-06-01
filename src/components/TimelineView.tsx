import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { Canvas, Group, Rect, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

import { ALL_EVENTS } from '@/data/events';
import { filterVisible } from '@/timeline/culling';
import { clampPixelsPerUnit, pixelsPerUnitToZoomLevel } from '@/timeline/lod';
import { viewportYearRange, yearToT } from '@/timeline/scale';
import {
  CATEGORY_LABELS,
  type Continent,
  type TimelineEvent,
  type ZoomLevel,
} from '@/data/schema';
import {
  LANE_GAP,
  LANE_HEIGHT,
  LANE_LABEL_WIDTH,
  colors,
  spacing,
  typography,
  type Category,
} from '@/theme/tokens';

type Props = {
  activeCategories: Set<Category>;
  continent: Continent;
  onSelectEvent: (event: TimelineEvent) => void;
};

const LANE_ORDER: Category[] = ['erdzeitalter', 'zivilisation', 'natur', 'nation'];

export function TimelineView({ activeCategories, continent, onSelectEvent }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = Math.max(0, screenWidth - LANE_LABEL_WIDTH);

  const offsetX = useSharedValue(0);
  const pixelsPerUnit = useSharedValue(150);
  const startOffsetX = useSharedValue(0);
  const startPixelsPerUnit = useSharedValue(150);
  const startFocalT = useSharedValue(0);

  // JS-side mirrors used for culling. Updated from worklets via runOnJS.
  const [jsOffsetX, setJsOffsetX] = useState(0);
  const [jsPixelsPerUnit, setJsPixelsPerUnit] = useState(150);

  useAnimatedReaction(
    () => ({ o: offsetX.value, p: pixelsPerUnit.value }),
    (curr, prev) => {
      if (!prev || Math.abs(curr.o - prev.o) > 0.5 || Math.abs(curr.p - prev.p) > 0.5) {
        runOnJS(setJsOffsetX)(curr.o);
        runOnJS(setJsPixelsPerUnit)(curr.p);
      }
    },
    [],
  );

  const lanes = useMemo(
    () => LANE_ORDER.filter((c) => activeCategories.has(c)),
    [activeCategories],
  );

  const zoomLevel: ZoomLevel = useMemo(
    () => pixelsPerUnitToZoomLevel(jsPixelsPerUnit),
    [jsPixelsPerUnit],
  );

  const visibleByLane = useMemo(() => {
    const range = viewportYearRange(canvasWidth, jsOffsetX, jsPixelsPerUnit);
    const out = new Map<Category, TimelineEvent[]>();
    for (const cat of lanes) {
      out.set(
        cat,
        filterVisible(ALL_EVENTS, {
          startYear: range.startYear,
          endYear: range.endYear,
          zoomLevel,
          categories: new Set<Category>([cat]),
          continent,
        }),
      );
    }
    return out;
  }, [canvasWidth, jsOffsetX, jsPixelsPerUnit, lanes, zoomLevel, continent]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startOffsetX.value = offsetX.value;
    })
    .onUpdate((e) => {
      offsetX.value = startOffsetX.value - e.translationX / pixelsPerUnit.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      startPixelsPerUnit.value = pixelsPerUnit.value;
      startFocalT.value = offsetX.value + e.focalX / pixelsPerUnit.value;
    })
    .onUpdate((e) => {
      const next = clampPixelsPerUnit(startPixelsPerUnit.value * e.scale);
      pixelsPerUnit.value = next;
      // Keep the pinch focal point fixed in t-space.
      offsetX.value = startFocalT.value - e.focalX / next;
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const canvasHeight = lanes.length * LANE_HEIGHT + Math.max(0, lanes.length - 1) * LANE_GAP;

  const handleTap = (event: TimelineEvent) => onSelectEvent(event);

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        {lanes.map((cat, idx) => (
          <View
            key={cat}
            style={[
              styles.label,
              {
                top: idx * (LANE_HEIGHT + LANE_GAP),
                height: LANE_HEIGHT,
                borderLeftColor: colors.category[cat],
              },
            ]}
          >
            <Text style={styles.labelText}>{CATEGORY_LABELS[cat]}</Text>
          </View>
        ))}
      </View>
      <GestureDetector gesture={gesture}>
        <View style={{ width: canvasWidth, height: canvasHeight }}>
          <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
            {lanes.map((cat, idx) => {
              const top = idx * (LANE_HEIGHT + LANE_GAP);
              const events = visibleByLane.get(cat) ?? [];
              return (
                <Group key={cat}>
                  <Rect
                    x={0}
                    y={top}
                    width={canvasWidth}
                    height={LANE_HEIGHT}
                    color={colors.laneBg[cat]}
                  />
                  {events.map((ev) => {
                    const startT = yearToT(ev.startYear);
                    const endT = yearToT(ev.endYear ?? ev.startYear);
                    const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                    const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                    return (
                      <Rect
                        key={ev.id}
                        x={x}
                        y={top + 18}
                        width={w}
                        height={LANE_HEIGHT - 36}
                        color={ev.color ?? colors.category[cat]}
                      />
                    );
                  })}
                </Group>
              );
            })}
          </Canvas>
          {/* Transparent tap overlays for hit testing — kept out of Skia to use RN touch. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {lanes.map((cat, idx) => {
              const top = idx * (LANE_HEIGHT + LANE_GAP);
              const events = visibleByLane.get(cat) ?? [];
              return events.map((ev) => {
                const startT = yearToT(ev.startYear);
                const endT = yearToT(ev.endYear ?? ev.startYear);
                const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                const w = Math.max(24, (endT - startT) * jsPixelsPerUnit);
                if (x + w < 0 || x > canvasWidth) return null;
                return (
                  <View
                    key={`hit-${ev.id}`}
                    onStartShouldSetResponder={() => {
                      handleTap(ev);
                      return false;
                    }}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: top + 18,
                      width: w,
                      height: LANE_HEIGHT - 36,
                    }}
                  />
                );
              });
            })}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  labels: {
    width: LANE_LABEL_WIDTH,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    justifyContent: 'center',
  },
  labelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
