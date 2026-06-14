import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { ScrollView } from 'react-native';
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
  PRESENT_RIGHT_PAD_FRACTION,
} from '@/timeline/lod';
import {
  tToYear,
  yearToT,
  T_MIN as TOTAL_T_MIN,
  T_MAX as TOTAL_T_MAX,
  T_PRESENT as T_HEUTE,
} from '@/timeline/scale';
import type { ZoomLevel } from '@/data/schema';

const ZOOM_TO_FIT_FILL = 0.7;
const ZOOM_TO_FIT_DURATION_MS = 600;
const ZOOM_STEP_FACTOR = 1.5;
const ZOOM_STEP_DURATION_MS = 300;

export type TimelineViewport = {
  /** Animated viewport state (native render + gestures read these). */
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

  /** Web horizontal scroll state + ref. */
  webScrollX: number;
  setWebScrollX: (v: number) => void;
  webScrollRef: React.RefObject<ScrollView>;
  webJumpScrollX: number | null;

  // Viewport commands (platform-aware internally).
  zoomToFit: (startYear: number, endYear: number | null | undefined) => void;
  zoomAtPoint: (focalX: number, factor: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  handleMinimapJump: (newOffsetX: number) => void;
};

type Options = {
  canvasWidth: number;
  /** Increment to animate back to the default human-history view (0 = skip). */
  resetKey: number;
  /** Called when the viewport moves (native), e.g. to close an open popover. */
  onViewportMove?: () => void;
};

/**
 * Owns the timeline viewport: offset / pixels-per-unit state, the web scroll
 * mirror, the worklet↔JS synchronisation and all zoom/pan/jump commands.
 *
 * Web and native share the same SharedValues for `pixelsPerUnit`; they differ
 * only in how the horizontal position is represented (native: `offsetX`
 * SharedValue + Reanimated animation; web: `webScrollX` + ScrollView). All the
 * platform branching lives here so the renderers stay declarative.
 */
export function useTimelineViewport({
  canvasWidth,
  resetKey,
  onViewportMove,
}: Options): TimelineViewport {
  // Default view: −400 000 years → Heute at right edge.
  const initState = humanHistoryViewState(canvasWidth);

  const offsetX = useSharedValue(initState.offsetX);
  const pixelsPerUnit = useSharedValue(initState.pixelsPerUnit);
  const startOffsetX = useSharedValue(0);
  const startPixelsPerUnit = useSharedValue(0);
  const startFocalT = useSharedValue(0);

  const [jsOffsetX, setJsOffsetX] = useState(initState.offsetX);
  const [jsPixelsPerUnit, setJsPixelsPerUnit] = useState(initState.pixelsPerUnit);

  const [webScrollX, setWebScrollX] = useState(0);
  const webScrollRef = useRef<ScrollView>(null);
  const [webJumpScrollX, setWebJumpScrollX] = useState<number | null>(null);
  const webInitScrolled = useRef(false);

  // Read the current canvasWidth in effects without re-subscribing.
  const canvasWidthRef = useRef(canvasWidth);
  useLayoutEffect(() => {
    canvasWidthRef.current = canvasWidth;
  });

  const zoomLevel: ZoomLevel = useMemo(
    () => pixelsPerUnitToZoomLevel(jsPixelsPerUnit),
    [jsPixelsPerUnit],
  );

  // Keep the latest onViewportMove without re-running the animated reaction.
  const onViewportMoveRef = useRef(onViewportMove);
  useLayoutEffect(() => {
    onViewportMoveRef.current = onViewportMove;
  }, [onViewportMove]);

  // Worklet → JS mirror sync. Threshold avoids spamming React on sub-pixel moves.
  useAnimatedReaction(
    () => ({ o: offsetX.value, p: pixelsPerUnit.value }),
    (curr, prev) => {
      if (!prev || Math.abs(curr.o - prev.o) > 0.5 || Math.abs(curr.p - prev.p) > 0.5) {
        runOnJS(setJsOffsetX)(curr.o);
        runOnJS(setJsPixelsPerUnit)(curr.p);
        if (onViewportMoveRef.current) runOnJS(onViewportMoveRef.current)();
      }
    },
    [],
  );

  // Animate to default view whenever resetKey increments (0 = initial mount, skip).
  useEffect(() => {
    if (resetKey === 0) return;
    const cw = canvasWidthRef.current;
    if (!cw) return;
    if (Platform.OS === 'web') {
      const ppu = humanHistoryViewState(cw).pixelsPerUnit;
      const heuteWebX = (T_HEUTE - TOTAL_T_MIN) * ppu;
      webScrollRef.current?.scrollTo({ x: Math.max(0, heuteWebX - cw), animated: true });
      return;
    }
    const state = humanHistoryViewState(cw);
    offsetX.value = withTiming(state.offsetX, { duration: ZOOM_TO_FIT_DURATION_MS });
    pixelsPerUnit.value = withTiming(state.pixelsPerUnit, { duration: ZOOM_TO_FIT_DURATION_MS });
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the web ScrollView to a jump target set by zoomToFit / minimap.
  useEffect(() => {
    if (webJumpScrollX === null) return;
    const target = webJumpScrollX;
    requestAnimationFrame(() => {
      webScrollRef.current?.scrollTo({ x: target, animated: true });
      setWebJumpScrollX(null);
    });
  }, [webJumpScrollX]);

  // On web, sync pixelsPerUnit and scroll to "Heute" on the first render with a
  // valid canvasWidth. contentOffset is only evaluated at mount (canvasWidth may
  // be 0 then), and useState ignores updated initial values after first render.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (webInitScrolled.current) return;
    if (canvasWidth <= 0) return;
    webInitScrolled.current = true;
    const ppu = humanHistoryViewState(canvasWidth).pixelsPerUnit;
    const heuteX = (T_HEUTE - TOTAL_T_MIN) * ppu;
    const targetX = Math.max(0, heuteX - canvasWidth);
    requestAnimationFrame(() => {
      pixelsPerUnit.value = ppu; // eslint-disable-line react-hooks/immutability
      setJsPixelsPerUnit(ppu);
      webScrollRef.current?.scrollTo({ x: targetX, animated: false });
    });
  }, [canvasWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animates the viewport to show [startYear, endYear] with padding each side.
  // For point events (no endYear), the 1.0 T-unit minimum prevents over-zoom.
  const zoomToFit = useCallback(
    (startYear: number, endYear: number | null | undefined) => {
      const startT = yearToT(startYear);
      const rawEndT = yearToT(endYear ?? startYear);
      const spanT = Math.max(Math.abs(rawEndT - startT), 1.0);
      const centerT = (startT + rawEndT) / 2;
      const newPPU = clampPixelsPerUnit(canvasWidth / (spanT / ZOOM_TO_FIT_FILL));
      if (Platform.OS === 'web') {
        // Direct PPU assignment is intentional on web: there is no Skia canvas, so
        // withTiming has no visual effect. The ScrollView scroll provides animation.
        const maxScrollX = Math.max(
          0,
          (TOTAL_T_MAX - TOTAL_T_MIN) * newPPU - canvasWidth * (1 - PRESENT_RIGHT_PAD_FRACTION),
        );
        pixelsPerUnit.value = newPPU;
        setJsPixelsPerUnit(newPPU);
        setWebJumpScrollX(
          Math.min(Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2), maxScrollX),
        );
      } else {
        const newOffsetX = clampOffsetX(centerT - canvasWidth / (2 * newPPU), newPPU, canvasWidth);
        pixelsPerUnit.value = withTiming(newPPU, { duration: ZOOM_TO_FIT_DURATION_MS });
        offsetX.value = withTiming(newOffsetX, { duration: ZOOM_TO_FIT_DURATION_MS });
      }
    },
    [canvasWidth, pixelsPerUnit, offsetX],
  );

  // Zoom keeping the given focal x-coordinate fixed (tap-to-zoom). Native only;
  // web uses zoomIn/zoomOut centred on the viewport.
  const zoomAtPoint = useCallback(
    (focalX: number, factor: number) => {
      const current = pixelsPerUnit.value;
      const next = clampPixelsPerUnit(current * factor);
      if (next === current) return;
      const focalT = offsetX.value + focalX / current;
      const nextOffset = clampOffsetX(focalT - focalX / next, next, canvasWidth);
      pixelsPerUnit.value = withTiming(next, { duration: ZOOM_STEP_DURATION_MS });
      offsetX.value = withTiming(nextOffset, { duration: ZOOM_STEP_DURATION_MS });
    },
    [canvasWidth, pixelsPerUnit, offsetX],
  );

  const handleMinimapJump = useCallback(
    (newOffsetX: number) => {
      if (Platform.OS === 'web') {
        const maxScrollX = Math.max(
          0,
          (TOTAL_T_MAX - TOTAL_T_MIN) * jsPixelsPerUnit -
            canvasWidth * (1 - PRESENT_RIGHT_PAD_FRACTION),
        );
        const newScrollX = Math.max(
          0,
          Math.min((newOffsetX - TOTAL_T_MIN) * jsPixelsPerUnit, maxScrollX),
        );
        setWebJumpScrollX(newScrollX);
      } else {
        offsetX.value = withTiming(newOffsetX, { duration: ZOOM_STEP_DURATION_MS });
      }
    },
    [jsPixelsPerUnit, canvasWidth, offsetX],
  );

  const zoomByStep = useCallback(
    (factor: number) => {
      if (Platform.OS === 'web') {
        const centerT = TOTAL_T_MIN + (webScrollX + canvasWidth / 2) / jsPixelsPerUnit;
        const newPPU = clampPixelsPerUnit(jsPixelsPerUnit * factor);
        pixelsPerUnit.value = newPPU;
        setJsPixelsPerUnit(newPPU);
        const newScrollX = Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2);
        requestAnimationFrame(() => {
          webScrollRef.current?.scrollTo({ x: newScrollX, animated: false });
        });
      } else {
        const center = offsetX.value + canvasWidth / (2 * pixelsPerUnit.value);
        const next = clampPixelsPerUnit(pixelsPerUnit.value * factor);
        const nextOffset = clampOffsetX(center - canvasWidth / (2 * next), next, canvasWidth);
        pixelsPerUnit.value = withTiming(next, { duration: ZOOM_STEP_DURATION_MS });
        offsetX.value = withTiming(nextOffset, { duration: ZOOM_STEP_DURATION_MS });
      }
    },
    [webScrollX, jsPixelsPerUnit, canvasWidth, offsetX, pixelsPerUnit],
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
    webScrollX,
    setWebScrollX,
    webScrollRef,
    webJumpScrollX,
    zoomToFit,
    zoomAtPoint,
    zoomIn,
    zoomOut,
    handleMinimapJump,
  };
}
