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
  /** Commits a scroll position to state + throttle ref (use for scroll events). */
  commitScrollX: (x: number) => void;
  webScrollRef: React.RefObject<ScrollView>;

  // Viewport commands (platform-aware internally).
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
  const webInitScrolled = useRef(false);
  // Last scroll X committed to state; the render-throttle compares against it,
  // and zoom/jump commands read it for the live position (the webScrollX state
  // lags right after a programmatic jump).
  const lastScrollXRef = useRef(0);

  // Commit a scroll position to both state and the throttle ref so a following
  // manual scroll measures its delta against the real current position.
  const commitScrollX = useCallback((x: number) => {
    lastScrollXRef.current = x;
    setWebScrollX(x);
  }, []);

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
  // NATIVE ONLY: on web the position is driven by webScrollX while offsetX.value
  // stays at its static init value — running this there would overwrite jsOffsetX
  // with that stale value and desync the render (timeline freezes after a jump).
  useAnimatedReaction(
    () => ({ o: offsetX.value, p: pixelsPerUnit.value }),
    (curr, prev) => {
      if (Platform.OS === 'web') return;
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

  // Animate to default view whenever resetKey increments (0 = initial mount, skip).
  useEffect(() => {
    if (resetKey === 0) return;
    const cw = canvasWidthRef.current;
    if (!cw) return;
    if (Platform.OS === 'web') {
      // Reset zoom too: without this the container stays rendered at the old
      // (possibly huge) PPU, so the scroll target is computed wrong and "Heute"
      // is never reached.
      const ppu = humanHistoryViewState(cw).pixelsPerUnit;
      pixelsPerUnit.value = ppu;
      setJsPixelsPerUnit(ppu);
      const heuteWebX = (T_HEUTE - TOTAL_T_MIN) * ppu;
      const targetX = Math.max(0, heuteWebX - cw);
      requestAnimationFrame(() => {
        webScrollRef.current?.scrollTo({ x: targetX, animated: false });
        commitScrollX(targetX);
      });
      return;
    }
    const state = humanHistoryViewState(cw);
    offsetX.value = withTiming(state.offsetX, { duration: ZOOM_TO_FIT_DURATION_MS });
    pixelsPerUnit.value = withTiming(state.pixelsPerUnit, { duration: ZOOM_TO_FIT_DURATION_MS });
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
      commitScrollX(targetX);
    });
  }, [canvasWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animates the viewport to show [startYear, endYear] with padding each side.
  const zoomToFit = useCallback(
    (startYear: number, endYear: number | null | undefined, webAnimated = false) => {
      const startT = yearToT(startYear);
      const rawEndT = yearToT(endYear ?? startYear);
      const rawSpanT = Math.abs(rawEndT - startT);
      // Point events (no real range) get a 200-year minimum so they don't zoom
      // in to a single year. Real ranges use their actual span — even short
      // modern eras must NOT be inflated, or the huge PPU pushes the right-clamped
      // viewport off to an unrelated earlier year.
      const isPoint = endYear === null || endYear === undefined || rawSpanT < 1e-6;
      const spanT = isPoint ? 200 : rawSpanT;
      const centerT = (startT + rawEndT) / 2;
      const newPPU = clampPixelsPerUnit(canvasWidth / (spanT / ZOOM_TO_FIT_FILL));
      if (Platform.OS === 'web') {
        const maxScrollX = Math.max(
          0,
          (TOTAL_T_MAX - TOTAL_T_MIN) * newPPU - canvasWidth * (1 - PRESENT_RIGHT_PAD_FRACTION),
        );
        const targetX = Math.min(
          Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2),
          maxScrollX,
        );
        pixelsPerUnit.value = newPPU;
        setJsPixelsPerUnit(newPPU);
        // PPU change must render (container resizes) before scrolling, so defer
        // to the next frame. animated:false avoids a divergence window where the
        // throttle ref (set to targetX) and the still-animating DOM disagree and
        // swallow the next gesture.
        requestAnimationFrame(() => {
          webScrollRef.current?.scrollTo({ x: targetX, animated: webAnimated });
          commitScrollX(targetX);
        });
      } else {
        const newOffsetX = clampOffsetX(centerT - canvasWidth / (2 * newPPU), newPPU, canvasWidth);
        pixelsPerUnit.value = withTiming(newPPU, { duration: ZOOM_TO_FIT_DURATION_MS });
        offsetX.value = withTiming(newOffsetX, { duration: ZOOM_TO_FIT_DURATION_MS });
      }
    },
    [canvasWidth, pixelsPerUnit, offsetX, commitScrollX],
  );

  // Jump back to the default human-history view with "Heute" at the right edge.
  // Works regardless of how deep the user has zoomed/panned (the explicit
  // "to today" button). On web also resets PPU so the container is re-sized.
  const jumpToToday = useCallback(() => {
    const cw = canvasWidthRef.current;
    if (!cw) return;
    if (Platform.OS === 'web') {
      const ppu = humanHistoryViewState(cw).pixelsPerUnit;
      pixelsPerUnit.value = ppu;
      setJsPixelsPerUnit(ppu);
      const heuteX = (T_HEUTE - TOTAL_T_MIN) * ppu;
      const targetX = Math.max(0, heuteX - cw);
      requestAnimationFrame(() => {
        webScrollRef.current?.scrollTo({ x: targetX, animated: true });
        commitScrollX(targetX);
      });
    } else {
      const state = humanHistoryViewState(cw);
      offsetX.value = withTiming(state.offsetX, { duration: ZOOM_TO_FIT_DURATION_MS });
      pixelsPerUnit.value = withTiming(state.pixelsPerUnit, { duration: ZOOM_TO_FIT_DURATION_MS });
    }
  }, [pixelsPerUnit, offsetX, commitScrollX]);

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
        // Scroll directly via the ref — avoids the fragile state round-trip that
        // got stuck when the clamped target equalled the last value.
        webScrollRef.current?.scrollTo({ x: newScrollX, animated: false });
        commitScrollX(newScrollX);
      } else {
        offsetX.value = withTiming(newOffsetX, { duration: ZOOM_STEP_DURATION_MS });
      }
    },
    [jsPixelsPerUnit, canvasWidth, offsetX, commitScrollX],
  );

  const zoomByStep = useCallback(
    (factor: number) => {
      if (Platform.OS === 'web') {
        // Read the LIVE scroll position from the ref (always current via
        // onScroll/commitScrollX); webScrollX state lags right after a jump and
        // would otherwise recenter the zoom on a stale position.
        const curScrollX = lastScrollXRef.current;
        const centerT = TOTAL_T_MIN + (curScrollX + canvasWidth / 2) / jsPixelsPerUnit;
        const newPPU = clampPixelsPerUnit(jsPixelsPerUnit * factor);
        if (newPPU === jsPixelsPerUnit) return;
        pixelsPerUnit.value = newPPU;
        setJsPixelsPerUnit(newPPU);
        const maxScrollX = Math.max(
          0,
          (TOTAL_T_MAX - TOTAL_T_MIN) * newPPU - canvasWidth * (1 - PRESENT_RIGHT_PAD_FRACTION),
        );
        const newScrollX = Math.min(
          Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2),
          maxScrollX,
        );
        requestAnimationFrame(() => {
          webScrollRef.current?.scrollTo({ x: newScrollX, animated: false });
          commitScrollX(newScrollX);
        });
      } else {
        const center = offsetX.value + canvasWidth / (2 * pixelsPerUnit.value);
        const next = clampPixelsPerUnit(pixelsPerUnit.value * factor);
        const nextOffset = clampOffsetX(center - canvasWidth / (2 * next), next, canvasWidth);
        pixelsPerUnit.value = withTiming(next, { duration: ZOOM_STEP_DURATION_MS });
        offsetX.value = withTiming(nextOffset, { duration: ZOOM_STEP_DURATION_MS });
      }
    },
    [jsPixelsPerUnit, canvasWidth, offsetX, pixelsPerUnit, commitScrollX],
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
    commitScrollX,
    webScrollRef,
    zoomToFit,
    zoomAtPoint,
    zoomIn,
    zoomOut,
    jumpToToday,
    handleMinimapJump,
  };
}
