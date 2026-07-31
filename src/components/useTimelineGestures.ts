import { useMemo } from 'react';
import type { ScrollView } from 'react-native';
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
  /**
   * Parent ScrollView ref (vertical scroll between lanes on mobile, #161).
   * Wired as a simultaneous external gesture so RNGH doesn't claim the touch
   * before the ScrollView gets a chance to recognize a vertical drag.
   */
  scrollRef?: React.RefObject<ScrollView | null>;
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
  scrollRef,
}: Params) {
  // Pan: activeOffsetX / failOffsetY lets vertical swipes pass to the parent ScrollView.
  // The X threshold is a little wider than the tap maxDistance so a deliberate
  // drag becomes a pan while a quick tap stays a tap (less accidental scrolling).
  // simultaneousWithExternalGesture(scrollRef) additionally tells RNGH not to
  // claim the touch outright, so the ScrollView still gets a chance to recognize
  // a vertical drag on the first frames instead of losing the race to the Pan
  // handler on some Android devices (#161 — vertical scroll between lanes was
  // sometimes swallowed by the timeline's own pan gesture).
  const panGesture = useMemo(() => {
    let pan = Gesture.Pan()
      .activeOffsetX([-12, 12])
      .failOffsetY([-8, 8])
      .onStart(() => {
        startOffsetX.value = offsetX.value;
      })
      .onUpdate((e) => {
        const raw = startOffsetX.value - e.translationX / pixelsPerUnit.value;
        offsetX.value = clampOffsetX(raw, pixelsPerUnit.value, canvasWidth);
      });
    if (scrollRef) {
      // RNGH's internal GestureRef type doesn't account for RefObject<T | null>
      // (React 19 ref shape); the ScrollView ref is valid at runtime regardless.
      pan = pan.simultaneousWithExternalGesture(
        scrollRef as unknown as Parameters<typeof pan.simultaneousWithExternalGesture>[0],
      );
    }
    return pan;
  }, [canvasWidth, startOffsetX, offsetX, pixelsPerUnit, scrollRef]);

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
