import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  clampOffsetX,
  clampPixelsPerUnit,
  humanHistoryViewState,
  pixelsPerUnitToZoomLevel,
} from '@/timeline/lod';
import { yearToT } from '@/timeline/scale';
import type { ZoomLevel } from '@/data/schema';

const ZOOM_TO_FIT_FILL = 0.7;
const ZOOM_TO_FIT_DURATION_MS = 600;
const ZOOM_STEP_FACTOR = 1.5;
const ZOOM_STEP_DURATION_MS = 300;

export type TimelineViewport = {
  /** Animated viewport state (render + gestures read these). */
  offsetX: SharedValue<number>;
  pixelsPerUnit: SharedValue<number>;
  /** Gesture scratch values. */
  startOffsetX: SharedValue<number>;
  startPixelsPerUnit: SharedValue<number>;
  startFocalT: SharedValue<number>;

  /** JS-side mirrors of offsetX / pixelsPerUnit (React render). */
  jsOffsetX: number;
  jsPixelsPerUnit: number;
  setJsPixelsPerUnit: (v: number) => void;
  /** Discrete zoom band derived from jsPixelsPerUnit. */
  zoomLevel: ZoomLevel;

  // Viewport commands (unified for web + native).
  zoomToFit: (startYear: number, endYear: number | null | undefined, webAnimated?: boolean) => void;
  zoomAtPoint: (focalX: number, factor: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  jumpToToday: () => void;
  handleMinimapJump: (newOffsetX: number) => void;
};

type Options = {
  canvasWidth: number;
  /** Increment to animate back to the default human-history view (0 = skip). */
  resetKey: number;
  /** Called when the viewport moves, e.g. to close an open popover. */
  onViewportMove?: () => void;
};

/**
 * Owns the timeline viewport: offset / pixels-per-unit state, the
 * worklet↔JS synchronisation and all zoom/pan/jump commands.
 *
 * Both web and native use the same SharedValues and Reanimated animations.
 * Pan on web is driven by RNGH gestures + a mouse-wheel shim in
 * TimelineCanvasWeb; there is no longer a separate ScrollView path.
 */
export function useTimelineViewport({
  canvasWidth,
  resetKey,
  onViewportMove,
}: Options): TimelineViewport {
  const initState = humanHistoryViewState(canvasWidth);

  const offsetX = useSharedValue(initState.offsetX);
  const pixelsPerUnit = useSharedValue(initState.pixelsPerUnit);
  const startOffsetX = useSharedValue(0);
  const startPixelsPerUnit = useSharedValue(0);
  const startFocalT = useSharedValue(0);

  const [jsOffsetX, setJsOffsetX] = useState(initState.offsetX);
  const [jsPixelsPerUnit, setJsPixelsPerUnit] = useState(initState.pixelsPerUnit);

  const canvasWidthRef = useRef(canvasWidth);
  useLayoutEffect(() => {
    canvasWidthRef.current = canvasWidth;
  });

  const zoomLevel: ZoomLevel = useMemo(
    () => pixelsPerUnitToZoomLevel(jsPixelsPerUnit),
    [jsPixelsPerUnit],
  );

  const onViewportMoveRef = useRef(onViewportMove);
  useLayoutEffect(() => {
    onViewportMoveRef.current = onViewportMove;
  }, [onViewportMove]);

  // Worklet → JS mirror sync. Threshold avoids spamming React on sub-pixel moves.
  // Runs on both web and native so the web renderer stays in sync with SharedValues.
  useAnimatedReaction(
    () => ({ o: offsetX.value, p: pixelsPerUnit.value }),
    (curr, prev) => {
      if (!prev) {
        runOnJS(setJsOffsetX)(curr.o);
        runOnJS(setJsPixelsPerUnit)(curr.p);
        if (onViewportMoveRef.current) runOnJS(onViewportMoveRef.current)();
        return;
      }
      const pixelMoved = Math.abs(curr.o - prev.o) * curr.p;
      const ppuRelChange = Math.abs(curr.p - prev.p) / (prev.p > 0 ? prev.p : 1);
      if (pixelMoved > 5 || ppuRelChange > 0.01) {
        runOnJS(setJsOffsetX)(curr.o);
        runOnJS(setJsPixelsPerUnit)(curr.p);
        if (onViewportMoveRef.current) runOnJS(onViewportMoveRef.current)();
      }
    },
    [],
  );

  // Initialize viewport once canvasWidth is valid (may be 0 on first render on web).
  const initDoneRef = useRef(false);
  useEffect(() => {
    if (initDoneRef.current) return;
    if (canvasWidth <= 0) return;
    initDoneRef.current = true;
    const state = humanHistoryViewState(canvasWidth);
    offsetX.value = state.offsetX; // eslint-disable-line react-hooks/immutability
    pixelsPerUnit.value = state.pixelsPerUnit; // eslint-disable-line react-hooks/immutability
  }, [canvasWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate back to the default human-history view when resetKey increments.
  useEffect(() => {
    if (resetKey === 0) return;
    const cw = canvasWidthRef.current;
    if (!cw) return;
    const state = humanHistoryViewState(cw);
    offsetX.value = withTiming(state.offsetX, { duration: ZOOM_TO_FIT_DURATION_MS }); // eslint-disable-line react-hooks/immutability
    pixelsPerUnit.value = withTiming(state.pixelsPerUnit, { duration: ZOOM_TO_FIT_DURATION_MS }); // eslint-disable-line react-hooks/immutability
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animates the viewport to show [startYear, endYear] with padding each side.
  const zoomToFit = useCallback(
    (startYear: number, endYear: number | null | undefined, _webAnimated?: boolean) => {
      const startT = yearToT(startYear);
      const rawEndT = yearToT(endYear ?? startYear);
      const rawSpanT = Math.abs(rawEndT - startT);
      // Point events (no real range) get a 200-year minimum so they don't zoom
      // in to a single year. Real ranges use their actual span.
      const isPoint = endYear === null || endYear === undefined || rawSpanT < 1e-6;
      const spanT = isPoint ? 200 : rawSpanT;
      const centerT = (startT + rawEndT) / 2;
      const newPPU = clampPixelsPerUnit(canvasWidth / (spanT / ZOOM_TO_FIT_FILL));
      const newOffsetX = clampOffsetX(centerT - canvasWidth / (2 * newPPU), newPPU, canvasWidth);
      pixelsPerUnit.value = withTiming(newPPU, { duration: ZOOM_TO_FIT_DURATION_MS }); // eslint-disable-line react-hooks/immutability
      offsetX.value = withTiming(newOffsetX, { duration: ZOOM_TO_FIT_DURATION_MS }); // eslint-disable-line react-hooks/immutability
    },
    [canvasWidth, pixelsPerUnit, offsetX],
  );

  // Jump back to the default human-history view with "Heute" at the right edge.
  const jumpToToday = useCallback(() => {
    const cw = canvasWidthRef.current;
    if (!cw) return;
    const state = humanHistoryViewState(cw);
    offsetX.value = withTiming(state.offsetX, { duration: ZOOM_TO_FIT_DURATION_MS }); // eslint-disable-line react-hooks/immutability
    pixelsPerUnit.value = withTiming(state.pixelsPerUnit, { duration: ZOOM_TO_FIT_DURATION_MS }); // eslint-disable-line react-hooks/immutability
  }, [pixelsPerUnit, offsetX]);

  // Zoom keeping the given focal x-coordinate fixed (tap-to-zoom / ctrl+wheel).
  const zoomAtPoint = useCallback(
    (focalX: number, factor: number) => {
      const current = pixelsPerUnit.value;
      const next = clampPixelsPerUnit(current * factor);
      if (next === current) return;
      const focalT = offsetX.value + focalX / current;
      const nextOffset = clampOffsetX(focalT - focalX / next, next, canvasWidth);
      pixelsPerUnit.value = withTiming(next, { duration: ZOOM_STEP_DURATION_MS }); // eslint-disable-line react-hooks/immutability
      offsetX.value = withTiming(nextOffset, { duration: ZOOM_STEP_DURATION_MS }); // eslint-disable-line react-hooks/immutability
    },
    [canvasWidth, pixelsPerUnit, offsetX],
  );

  const handleMinimapJump = useCallback(
    (newOffsetX: number) => {
      offsetX.value = withTiming(newOffsetX, { duration: ZOOM_STEP_DURATION_MS }); // eslint-disable-line react-hooks/immutability
    },
    [offsetX],
  );

  const zoomByStep = useCallback(
    (factor: number) => {
      const center = offsetX.value + canvasWidth / (2 * pixelsPerUnit.value);
      const next = clampPixelsPerUnit(pixelsPerUnit.value * factor);
      const nextOffset = clampOffsetX(center - canvasWidth / (2 * next), next, canvasWidth);
      pixelsPerUnit.value = withTiming(next, { duration: ZOOM_STEP_DURATION_MS }); // eslint-disable-line react-hooks/immutability
      offsetX.value = withTiming(nextOffset, { duration: ZOOM_STEP_DURATION_MS }); // eslint-disable-line react-hooks/immutability
    },
    [canvasWidth, offsetX, pixelsPerUnit],
  );

  const zoomIn = useCallback(() => zoomByStep(ZOOM_STEP_FACTOR), [zoomByStep]);
  const zoomOut = useCallback(() => zoomByStep(1 / ZOOM_STEP_FACTOR), [zoomByStep]);

  return {
    offsetX,
    pixelsPerUnit,
    startOffsetX,
    startPixelsPerUnit,
    startFocalT,
    jsOffsetX,
    jsPixelsPerUnit,
    setJsPixelsPerUnit,
    zoomLevel,
    zoomToFit,
    zoomAtPoint,
    zoomIn,
    zoomOut,
    jumpToToday,
    handleMinimapJump,
  };
}
