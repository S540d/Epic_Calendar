import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, type SharedValue } from 'react-native-reanimated';
import { clampOffsetX, clampPixelsPerUnit } from '@/timeline/lod';
import { TAP_ZOOM_FACTOR } from './timelineRenderShared';

type Params = {
  canvasWidth: number;
  offsetX: SharedValue<number>;
  pixelsPerUnit: SharedValue<number>;
  startOffsetX: SharedValue<number>;
  startPixelsPerUnit: SharedValue<number>;
  startFocalT: SharedValue<number>;
  /** Canvas-space tap handler (selection / disambiguation popover). */
  onTap: (px: number, py: number) => void;
  /** Zoom keeping a focal x fixed (double-tap zoom-in). */
  zoomAtPoint: (focalX: number, factor: number) => void;
};

/**
 * Builds the composed pan + pinch + tap/double-tap gesture for the native
 * timeline canvas. Pan/pinch mutate the viewport SharedValues directly on the
 * UI thread; taps hop to JS via runOnJS.
 */
export function useTimelineGestures({
  canvasWidth,
  offsetX,
  pixelsPerUnit,
  startOffsetX,
  startPixelsPerUnit,
  startFocalT,
  onTap,
  zoomAtPoint,
}: Params) {
  // Pan: activeOffsetX / failOffsetY lets vertical swipes pass to the parent ScrollView.
  // The X threshold is a little wider than the tap maxDistance so a deliberate
  // drag becomes a pan while a quick tap stays a tap (less accidental scrolling).
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-8, 8])
        .onStart(() => {
          startOffsetX.value = offsetX.value;
        })
        .onUpdate((e) => {
          const raw = startOffsetX.value - e.translationX / pixelsPerUnit.value;
          offsetX.value = clampOffsetX(raw, pixelsPerUnit.value, canvasWidth);
        }),
    [canvasWidth, startOffsetX, offsetX, pixelsPerUnit],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart((e) => {
          startPixelsPerUnit.value = pixelsPerUnit.value;
          startFocalT.value = offsetX.value + e.focalX / pixelsPerUnit.value;
        })
        .onUpdate((e) => {
          const next = clampPixelsPerUnit(startPixelsPerUnit.value * e.scale);
          pixelsPerUnit.value = next;
          offsetX.value = clampOffsetX(startFocalT.value - e.focalX / next, next, canvasWidth);
        }),
    [canvasWidth, startPixelsPerUnit, pixelsPerUnit, offsetX, startFocalT],
  );

  // Single tap → select the nearest event under the finger. maxDistance keeps it
  // from firing once a pan starts.
  const singleTap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .maxDistance(10)
        // eslint-disable-next-line react-hooks/refs
        .onEnd((e) => {
          runOnJS(onTap)(e.x, e.y);
        }),
    [onTap],
  );

  // Double tap → zoom in centered on the tap point. maxDelay bounds how long
  // singleTap waits for a possible second tap before firing (~250 ms worst case).
  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(300)
        .maxDelay(250)
        .maxDistance(20)
        .onEnd((e) => {
          runOnJS(zoomAtPoint)(e.x, TAP_ZOOM_FACTOR);
        }),
    [zoomAtPoint],
  );

  const exclusiveGesture = useMemo(
    () => Gesture.Exclusive(doubleTap, singleTap),
    [doubleTap, singleTap],
  );

  return useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture, exclusiveGesture),
    [panGesture, pinchGesture, exclusiveGesture],
  );
}
