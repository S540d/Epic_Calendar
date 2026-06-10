import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedReaction, runOnJS, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

// Only import Skia for native platforms
let Canvas: any = null;
let Group: any = null;
let Rect: any = null;
if (Platform.OS !== 'web') {
  try {
    const skia = require('@shopify/react-native-skia');
    Canvas = skia.Canvas;
    Group = skia.Group;
    Rect = skia.Rect;
  } catch {
    // Skia not available
  }
}

import { EpochJumpBar } from './EpochJumpBar';
import { TimeAxis } from './TimeAxis';
import { TimelineBreadcrumb } from './TimelineBreadcrumb';
import { TimelineMinimap } from './TimelineMinimap';
import { ZoomLevelIndicator } from './ZoomLevelIndicator';
import { ALL_EVENTS } from '@/data/events';
import { assignTracks, filterVisible, type TrackMap } from '@/timeline/culling';
import {
  clampOffsetX,
  clampPixelsPerUnit,
  eventLabelFontSize,
  eventLabelMaxLines,
  humanHistoryViewState,
  pixelsPerUnitToZoomLevel,
} from '@/timeline/lod';
import { viewportYearRange, yearToT, tToYear, pixelToYear } from '@/timeline/scale';
import { dominantEpoch } from '@/timeline/epoch';
import { type Continent, type TimelineEvent, type ZoomLevel } from '@/data/schema';
import {
  LANE_GAP,
  LANE_HEIGHT,
  LANE_LABEL_WIDTH,
  LANE_PADDING_V,
  TRACK_HEIGHT,
  colors,
  eventColor,
  shadows,
  spacing,
  typography,
  type Category,
} from '@/theme/tokens';

type Props = {
  activeCategories: Set<Category>;
  continent: Continent;
  onSelectEvent: (event: TimelineEvent) => void;
  /** Increment to animate back to the default human-history view. */
  resetKey?: number;
};

const LANE_ORDER: Category[] = ['erdzeitalter', 'zivilisation', 'natur', 'nation'];

const TOTAL_T_MIN = yearToT(-13_800_000_000);
const T_HEUTE = yearToT(2026);
const TOTAL_T_MAX = T_HEUTE;

/** Minimum visible bar width to attempt rendering a (possibly truncated) label. */
const LABEL_MIN_BAR_PX = 22;
const LABEL_MAX_WIDTH = 96;
const POPOVER_MAX_WIDTH = 220;
const POPOVER_MAX_HEIGHT = 200;

/** Minimum touch-target size (iOS HIG 44pt / Material 48dp) for event taps. */
const MIN_HIT_PX = 44;
/** Fraction of viewport used by the event span when zooming to fit. */
const ZOOM_TO_FIT_FILL = 0.7;
/** Maximum events rendered per lane; excess shows a "+N" cluster badge. */
const MAX_EVENTS_PER_LANE = 15;
/** Zoom factor applied per double-tap / two-finger-tap. */
const TAP_ZOOM_FACTOR = 1.8;
/** Duration of the zoom-to-fit pan/scale animation on native. */
const ZOOM_TO_FIT_DURATION_MS = 600;
/** Delay before opening the detail modal after a zoom-to-fit animation.
 *  On web there is no animated zoom (direct PPU assignment), so a shorter
 *  delay covers the scroll animation only. */
const ZOOM_MODAL_DELAY_MS = Platform.OS === 'web' ? 350 : ZOOM_TO_FIT_DURATION_MS + 50;

/** Returns the pixel height of a lane with the given number of tracks. */
function laneHeightForTracks(n: number): number {
  return n * TRACK_HEIGHT + LANE_PADDING_V * 2;
}

/**
 * Collision-aware label visibility: checks collisions per track so events
 * in different tracks never suppress each other. Largest bars win.
 */
function computeLabelVisibleIds(
  visibleByLane: Map<Category, TimelineEvent[]>,
  tracksByLane: Map<Category, TrackMap>,
  jsOffsetX: number,
  jsPixelsPerUnit: number,
  canvasWidth: number,
): Set<string> {
  const result = new Set<string>();
  for (const [cat, events] of visibleByLane.entries()) {
    const trackMap = tracksByLane.get(cat);
    // Group events by track
    const byTrack = new Map<number, TimelineEvent[]>();
    for (const ev of events) {
      const t = trackMap?.get(ev.id);
      if (t === undefined) continue; // event beyond MAX_EVENTS_PER_LANE cap — no bar rendered
      if (!byTrack.has(t)) byTrack.set(t, []);
      byTrack.get(t)!.push(ev);
    }
    for (const trackEvents of byTrack.values()) {
      const placed: Array<{ l: number; r: number }> = [];
      const sorted = [...trackEvents].sort((a, b) => {
        const wa = (yearToT(a.endYear ?? a.startYear) - yearToT(a.startYear)) * jsPixelsPerUnit;
        const wb = (yearToT(b.endYear ?? b.startYear) - yearToT(b.startYear)) * jsPixelsPerUnit;
        return wb - wa;
      });
      for (const ev of sorted) {
        const x = (yearToT(ev.startYear) - jsOffsetX) * jsPixelsPerUnit;
        const w = Math.max(
          0,
          (yearToT(ev.endYear ?? ev.startYear) - yearToT(ev.startYear)) * jsPixelsPerUnit,
        );
        if (w < LABEL_MIN_BAR_PX) continue;
        const visibleLeft = Math.max(x, 0);
        const visibleRight = Math.min(x + w, canvasWidth);
        if (visibleRight - visibleLeft < 6) continue;
        const lx = visibleLeft + 3;
        const rx = lx + Math.min(LABEL_MAX_WIDTH, visibleRight - visibleLeft - 6);
        if (placed.some((p) => lx < p.r && rx > p.l)) continue;
        placed.push({ l: lx, r: rx });
        result.add(ev.id);
      }
    }
  }
  return result;
}

export function TimelineView({ activeCategories, continent, onSelectEvent, resetKey = 0 }: Props) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = Math.max(0, screenWidth - LANE_LABEL_WIDTH);

  // Default view: −400 000 years → Heute at right edge
  const initState = humanHistoryViewState(canvasWidth);

  const offsetX = useSharedValue(initState.offsetX);
  const pixelsPerUnit = useSharedValue(initState.pixelsPerUnit);
  const startOffsetX = useSharedValue(0);
  const startPixelsPerUnit = useSharedValue(0);
  const startFocalT = useSharedValue(0);

  // JS-side mirrors updated from worklets via runOnJS
  const [jsOffsetX, setJsOffsetX] = useState(initState.offsetX);
  const [jsPixelsPerUnit, setJsPixelsPerUnit] = useState(initState.pixelsPerUnit);

  // Web: horizontal scroll position + ref for programmatic reset
  const [webScrollX, setWebScrollX] = useState(0);
  const webScrollRef = useRef<ScrollView>(null);
  // When set, a useEffect fires to animate the web ScrollView to that X position.
  const [webJumpScrollX, setWebJumpScrollX] = useState<number | null>(null);
  // Event queued to open after the zoom-to-fit animation completes (#44).
  const [pendingSelectEvent, setPendingSelectEvent] = useState<TimelineEvent | null>(null);

  // Popover shown when a tap hits multiple overlapping events (#35)
  const [popoverState, setPopoverState] = useState<{
    events: TimelineEvent[];
    x: number;
    y: number;
  } | null>(null);

  // Ref so the reset effect always reads the current canvasWidth without re-subscribing
  const canvasWidthRef = useRef(canvasWidth);

  // Stable snapshot of all hit-test inputs, updated after every render so that
  // handleCanvasTap (memoized with []) always reads up-to-date data.
  const tapDataRef = useRef({
    lanes: [] as Category[],
    laneTops: [] as number[],
    laneTrackCounts: new Map<Category, number>(),
    visibleByLane: new Map<Category, TimelineEvent[]>(),
    tracksByLane: new Map<Category, TrackMap>(),
    jsOffsetX: initState.offsetX,
    jsPixelsPerUnit: initState.pixelsPerUnit,
  });

  // Stable ref to the latest zoomToFit closure so handleCanvasTap doesn't need it as dep.
  const zoomToFitRef = useRef<(startYear: number, endYear: number | null | undefined) => void>(
    () => {},
  );

  // Stable ref to onSelectEvent so the pending-modal timer doesn't restart if the
  // parent recreates the callback while a zoom animation is in progress.
  const onSelectEventRef = useRef(onSelectEvent);
  useLayoutEffect(() => {
    onSelectEventRef.current = onSelectEvent;
  }, [onSelectEvent]);

  useLayoutEffect(() => {
    canvasWidthRef.current = canvasWidth;
  });

  // Open the detail modal after the zoom-to-fit animation; clears on unmount.
  useEffect(() => {
    if (!pendingSelectEvent) return;
    const ev = pendingSelectEvent;
    const timer = setTimeout(() => {
      onSelectEventRef.current(ev);
      setPendingSelectEvent(null);
    }, ZOOM_MODAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pendingSelectEvent]);

  // Animate to default view whenever resetKey increments (0 = initial mount, skip)
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
    offsetX.value = withTiming(state.offsetX, { duration: 600 });
    pixelsPerUnit.value = withTiming(state.pixelsPerUnit, { duration: 600 });
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the web ScrollView to a jump target set by zoomToFit.
  // Accessing refs in effects is the approved React pattern (#44/#39).
  useEffect(() => {
    if (webJumpScrollX === null) return;
    const target = webJumpScrollX;
    requestAnimationFrame(() => {
      webScrollRef.current?.scrollTo({ x: target, animated: true });
      setWebJumpScrollX(null);
    });
  }, [webJumpScrollX]);

  useAnimatedReaction(
    () => ({ o: offsetX.value, p: pixelsPerUnit.value }),
    (curr, prev) => {
      if (!prev || Math.abs(curr.o - prev.o) > 0.5 || Math.abs(curr.p - prev.p) > 0.5) {
        runOnJS(setJsOffsetX)(curr.o);
        runOnJS(setJsPixelsPerUnit)(curr.p);
        // Close disambiguation popover when the viewport moves
        runOnJS(setPopoverState)(null);
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

  // How many events are hidden per lane due to the MAX_EVENTS_PER_LANE cap.
  const overflowCounts = useMemo(() => {
    const out = new Map<Category, number>();
    for (const [cat, events] of visibleByLane) {
      if (events.length > MAX_EVENTS_PER_LANE) out.set(cat, events.length - MAX_EVENTS_PER_LANE);
    }
    return out;
  }, [visibleByLane]);

  const tracksByLane = useMemo(() => {
    const out = new Map<Category, TrackMap>();
    for (const [cat, events] of visibleByLane) {
      // Only assign tracks for the capped set so layout stays predictable.
      out.set(cat, assignTracks(events.slice(0, MAX_EVENTS_PER_LANE)));
    }
    return out;
  }, [visibleByLane]);

  const laneTrackCounts = useMemo(() => {
    const out = new Map<Category, number>();
    for (const [cat, tm] of tracksByLane) {
      const max = tm.size === 0 ? 0 : Math.max(...tm.values());
      out.set(cat, max + 1);
    }
    return out;
  }, [tracksByLane]);

  const laneTops = useMemo(() => {
    const tops: number[] = [];
    let cursor = 0;
    for (const cat of lanes) {
      tops.push(cursor);
      cursor += laneHeightForTracks(laneTrackCounts.get(cat) ?? 1) + LANE_GAP;
    }
    return tops;
  }, [lanes, laneTrackCounts]);

  const labelVisibleIds = useMemo(
    () =>
      computeLabelVisibleIds(visibleByLane, tracksByLane, jsOffsetX, jsPixelsPerUnit, canvasWidth),
    [visibleByLane, tracksByLane, jsOffsetX, jsPixelsPerUnit, canvasWidth],
  );

  const viewportRange = useMemo(
    () => viewportYearRange(canvasWidth, jsOffsetX, jsPixelsPerUnit),
    [canvasWidth, jsOffsetX, jsPixelsPerUnit],
  );

  const epochLabel = useMemo(() => {
    const centerYear = pixelToYear(canvasWidth / 2, jsOffsetX, jsPixelsPerUnit);
    return dominantEpoch(centerYear)?.title ?? null;
  }, [canvasWidth, jsOffsetX, jsPixelsPerUnit]);

  const heutePx = useMemo(
    () => (T_HEUTE - jsOffsetX) * jsPixelsPerUnit,
    [jsOffsetX, jsPixelsPerUnit],
  );
  const heuteVisible = heutePx >= -1 && heutePx <= canvasWidth + 1;

  // Web-path visibility data, memoized like native counterparts.
  // Returns empty maps on native (Platform.OS is a compile-time constant).
  const webVisibleByLane = useMemo(() => {
    if (Platform.OS !== 'web') return new Map<Category, TimelineEvent[]>();
    const webOffsetX = TOTAL_T_MIN + webScrollX / jsPixelsPerUnit;
    const visStartYear = tToYear(webOffsetX);
    const visEndYear = tToYear(webOffsetX + canvasWidth / jsPixelsPerUnit);
    const out = new Map<Category, TimelineEvent[]>();
    for (const cat of lanes) {
      out.set(cat, filterVisible(ALL_EVENTS, {
        startYear: visStartYear,
        endYear: visEndYear,
        zoomLevel,
        categories: new Set<Category>([cat]),
        continent,
      }));
    }
    return out;
  }, [webScrollX, jsPixelsPerUnit, canvasWidth, lanes, zoomLevel, continent]);

  const webOverflowCounts = useMemo(() => {
    const out = new Map<Category, number>();
    for (const [cat, events] of webVisibleByLane) {
      if (events.length > MAX_EVENTS_PER_LANE) out.set(cat, events.length - MAX_EVENTS_PER_LANE);
    }
    return out;
  }, [webVisibleByLane]);

  const webTracksByLane = useMemo(() => {
    const out = new Map<Category, TrackMap>();
    for (const cat of lanes) {
      const evs = (webVisibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
      out.set(cat, assignTracks(evs));
    }
    return out;
  }, [webVisibleByLane, lanes]);

  // Canvas-space hit-test (native). Enforces a minimum 44px hit-box per event.
  // If exactly one event is hit, selects it immediately.
  // If multiple events overlap at the tap position, shows a disambiguation popover.
  // Stable (empty deps): reads current render data via tapDataRef, calls zoomToFit via zoomToFitRef.
  const handleCanvasTap = useCallback((px: number, py: number) => {
    const {
      lanes, laneTops, laneTrackCounts, visibleByLane, tracksByLane,
      jsOffsetX, jsPixelsPerUnit,
    } = tapDataRef.current;
    const candidates: Array<{ ev: TimelineEvent; dist: number }> = [];
    for (let i = 0; i < lanes.length; i++) {
      const cat = lanes[i];
      if (!cat) continue;
      const laneTop = laneTops[i] ?? 0;
      const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
      if (py < laneTop || py > laneTop + laneH) continue;
      const events = visibleByLane.get(cat) ?? [];
      const trackMap = tracksByLane.get(cat);
      for (const ev of events) {
        const trackIdx = trackMap?.get(ev.id);
        if (trackIdx === undefined) continue; // beyond MAX_EVENTS_PER_LANE cap — no bar rendered
        const startT = yearToT(ev.startYear);
        const endT = yearToT(ev.endYear ?? ev.startYear);
        const x = (startT - jsOffsetX) * jsPixelsPerUnit;
        const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
        const barY = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
        const barH = TRACK_HEIGHT - 8;
        if (py < barY || py > barY + barH) continue;
        const cx = x + w / 2;
        const half = Math.max(w, MIN_HIT_PX) / 2;
        if (px < cx - half || px > cx + half) continue;
        candidates.push({ ev, dist: Math.abs(px - cx) });
      }
    }
    if (candidates.length === 0) return;
    candidates.sort((a, b) => a.dist - b.dist);
    if (candidates.length === 1) {
      const first = candidates[0];
      if (first) {
        zoomToFitRef.current(first.ev.startYear, first.ev.endYear);
        setPendingSelectEvent(first.ev);
      }
    } else {
      setPendingSelectEvent(null);
      setPopoverState({ events: candidates.map((c) => c.ev), x: px, y: py });
    }
  }, []);

  // Zoom keeping the given focal x-coordinate fixed (used by tap-to-zoom).
  // Stable except on screen resize (canvasWidth changes); shared values are stable refs.
  const zoomAtPoint = useCallback((focalX: number, factor: number) => {
    const current = pixelsPerUnit.value;
    const next = clampPixelsPerUnit(current * factor);
    if (next === current) return;
    const focalT = offsetX.value + focalX / current;
    const nextOffset = clampOffsetX(focalT - focalX / next, next, canvasWidth);
    pixelsPerUnit.value = withTiming(next, { duration: 300 });
    offsetX.value = withTiming(nextOffset, { duration: 300 });
  }, [canvasWidth, pixelsPerUnit, offsetX]);

  // Pan: activeOffsetX / failOffsetY lets vertical swipes pass to the parent ScrollView.
  // The X threshold is a little wider than the tap maxDistance so a deliberate
  // drag becomes a pan while a quick tap stays a tap (less accidental scrolling).
  // Memoized so RNGH doesn't rebuild the handler tree on every pan frame.
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

  // Single tap → select the nearest event under the finger (with an enforced
  // minimum hit-box so even hair-thin bars are reachable). maxDistance keeps it
  // from firing once a pan starts.
  const singleTap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .maxDistance(10)
        // eslint-disable-next-line react-hooks/refs
        .onEnd((e) => {
          runOnJS(handleCanvasTap)(e.x, e.y);
        }),
    [handleCanvasTap],
  );

  // Double tap → zoom in centered on the tap point. (Zoom-out is covered by
  // pinch and the − button; gesture-handler's Tap has no multi-pointer mode.)
  // maxDelay bounds how long singleTap waits for a possible second tap before
  // firing, so event selection stays snappy (~250 ms worst case).
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

  const gesture = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture, exclusiveGesture),
    [panGesture, pinchGesture, exclusiveGesture],
  );

  const canvasHeight = Math.max(
    lanes.reduce(
      (sum, cat, i) =>
        sum +
        laneHeightForTracks(laneTrackCounts.get(cat) ?? 1) +
        (i < lanes.length - 1 ? LANE_GAP : 0),
      0,
    ),
    80,
  );

  // Animates the viewport to show [startYear, endYear] with ~30% padding each side.
  // For point events (no endYear), the 1.0 T-unit minimum prevents excessive zoom.
  const zoomToFit = useCallback((startYear: number, endYear: number | null | undefined) => {
    const startT = yearToT(startYear);
    const rawEndT = yearToT(endYear ?? startYear);
    const spanT = Math.max(Math.abs(rawEndT - startT), 1.0);
    const centerT = (startT + rawEndT) / 2;
    const newPPU = clampPixelsPerUnit(canvasWidth / (spanT / ZOOM_TO_FIT_FILL));
    if (Platform.OS === 'web') {
      // Direct PPU assignment is intentional on web: there is no Skia canvas, so
      // withTiming would have no visual effect. The ScrollView scroll provides animation.
      const maxScrollX = Math.max(0, (TOTAL_T_MAX - TOTAL_T_MIN) * newPPU - canvasWidth);
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
  }, [canvasWidth, pixelsPerUnit, offsetX, setJsPixelsPerUnit, setWebJumpScrollX]);

  // tapDataRef: update every render so handleCanvasTap always reads current viewport state.
  useLayoutEffect(() => {
    Object.assign(tapDataRef.current, {
      lanes, laneTops, laneTrackCounts, visibleByLane, tracksByLane,
      jsOffsetX, jsPixelsPerUnit,
    });
  });
  // zoomToFitRef: only update when zoomToFit rebuilds (on canvasWidth resize).
  useLayoutEffect(() => {
    zoomToFitRef.current = zoomToFit;
  }, [zoomToFit]);

  const handleTap = useCallback((event: TimelineEvent) => {
    zoomToFit(event.startYear, event.endYear);
    setPendingSelectEvent(event);
  }, [zoomToFit]);

  const handleMinimapJump = useCallback((newOffsetX: number) => {
    if (Platform.OS === 'web') {
      const maxScrollX = Math.max(0, (TOTAL_T_MAX - TOTAL_T_MIN) * jsPixelsPerUnit - canvasWidth);
      const newScrollX = Math.max(0, Math.min((newOffsetX - TOTAL_T_MIN) * jsPixelsPerUnit, maxScrollX));
      setWebJumpScrollX(newScrollX);
    } else {
      offsetX.value = withTiming(newOffsetX, { duration: 300 });
    }
  }, [jsPixelsPerUnit, canvasWidth, offsetX, setWebJumpScrollX]);

  const zoomIn = () => {
    if (Platform.OS === 'web') {
      const centerT = TOTAL_T_MIN + (webScrollX + canvasWidth / 2) / jsPixelsPerUnit;
      const newPPU = clampPixelsPerUnit(jsPixelsPerUnit * 1.5);
      pixelsPerUnit.value = newPPU;
      setJsPixelsPerUnit(newPPU);
      const newScrollX = Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2);
      requestAnimationFrame(() => {
        webScrollRef.current?.scrollTo({ x: newScrollX, animated: false });
      });
    } else {
      const center = offsetX.value + canvasWidth / (2 * pixelsPerUnit.value);
      const next = clampPixelsPerUnit(pixelsPerUnit.value * 1.5);
      const nextOffset = clampOffsetX(center - canvasWidth / (2 * next), next, canvasWidth);
      pixelsPerUnit.value = withTiming(next, { duration: 300 });
      offsetX.value = withTiming(nextOffset, { duration: 300 });
    }
  };

  const zoomOut = () => {
    if (Platform.OS === 'web') {
      const centerT = TOTAL_T_MIN + (webScrollX + canvasWidth / 2) / jsPixelsPerUnit;
      const newPPU = clampPixelsPerUnit(jsPixelsPerUnit / 1.5);
      pixelsPerUnit.value = newPPU;
      setJsPixelsPerUnit(newPPU);
      const newScrollX = Math.max(0, (centerT - TOTAL_T_MIN) * newPPU - canvasWidth / 2);
      requestAnimationFrame(() => {
        webScrollRef.current?.scrollTo({ x: newScrollX, animated: false });
      });
    } else {
      const center = offsetX.value + canvasWidth / (2 * pixelsPerUnit.value);
      const next = clampPixelsPerUnit(pixelsPerUnit.value / 1.5);
      const nextOffset = clampOffsetX(center - canvasWidth / (2 * next), next, canvasWidth);
      pixelsPerUnit.value = withTiming(next, { duration: 300 });
      offsetX.value = withTiming(nextOffset, { duration: 300 });
    }
  };

  // ─── Web fallback ─────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    const WEB_PPU = jsPixelsPerUnit;
    const webCanvasWidth = Math.ceil((TOTAL_T_MAX - TOTAL_T_MIN) * WEB_PPU);
    const webOffsetAtZero = TOTAL_T_MIN;
    const webOffsetX = webOffsetAtZero + webScrollX / WEB_PPU;

    const heuteWebX = (T_HEUTE - TOTAL_T_MIN) * WEB_PPU;
    const initWebScrollX = Math.max(0, heuteWebX - canvasWidth);

    const visibleStartYear = tToYear(webOffsetX);
    const visibleEndYear = tToYear(webOffsetX + canvasWidth / WEB_PPU);
    const webCenterYear = tToYear(webOffsetX + canvasWidth / (2 * WEB_PPU));
    const webEpochLabel = dominantEpoch(webCenterYear)?.title ?? null;

    return (
      <View style={{ flex: 1 }}>
        <View
          style={[
            styles.axisRow,
            Platform.select({ web: { position: 'sticky', top: 0, zIndex: 10 } as any }),
          ]}
        >
          <View style={{ width: LANE_LABEL_WIDTH }} />
          <TimeAxis
            offsetX={webOffsetX}
            pixelsPerUnit={WEB_PPU}
            canvasWidth={canvasWidth}
            zoomLevel={zoomLevel}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <ZoomLevelIndicator zoomLevel={zoomLevel} />
            <TimelineBreadcrumb
              startYear={visibleStartYear}
              endYear={visibleEndYear}
              epoch={webEpochLabel}
            />
          </View>
        </View>
        <TimelineMinimap
          offsetX={webOffsetX}
          pixelsPerUnit={WEB_PPU}
          canvasWidth={canvasWidth}
          onJump={handleMinimapJump}
        />
        <EpochJumpBar onJump={zoomToFit} />
        <View style={styles.container}>
          <View
            style={[
              styles.labels,
              Platform.select({ web: { position: 'sticky', left: 0, zIndex: 5 } as any }),
            ]}
          >
            {lanes.map((cat, idx) => {
              const overflow = webOverflowCounts.get(cat) ?? 0;
              return (
                <View
                  key={cat}
                  style={[
                    styles.label,
                    {
                      top: laneTops[idx],
                      height: laneHeightForTracks(laneTrackCounts.get(cat) ?? 1),
                      borderLeftColor: colors.category[cat],
                    },
                  ]}
                >
                  <Text style={styles.labelText}>{t(`category.${cat}`)}</Text>
                  {overflow > 0 && (
                    <Text style={styles.clusterBadge}>+{overflow}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <ScrollView
            ref={webScrollRef}
            horizontal
            style={{ flex: 1, backgroundColor: colors.bg }}
            scrollEventThrottle={16}
            onScroll={(e) => setWebScrollX(e.nativeEvent.contentOffset.x)}
            contentOffset={{ x: initWebScrollX, y: 0 }}
          >
            <View style={{ width: webCanvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                // Clip to MAX_EVENTS_PER_LANE; excess is shown as badge in lane label.
                const events = (webVisibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
                const webTrackMap = webTracksByLane.get(cat);
                const lblSize = eventLabelFontSize(zoomLevel);
                const maxLines = eventLabelMaxLines(zoomLevel);
                return (
                  <View key={cat}>
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: laneTop,
                        width: webCanvasWidth,
                        height: laneH,
                        backgroundColor: colors.laneBg[cat],
                      }}
                    />
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      const x = (startT - webOffsetAtZero) * WEB_PPU;
                      const w = Math.max(2, (endT - startT) * WEB_PPU);
                      const trackIdx = webTrackMap?.get(ev.id) ?? 0;
                      const barTop = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                      const barHeight = TRACK_HEIGHT - 8;
                      const stickyLabelLeft =
                        w >= LABEL_MIN_BAR_PX ? Math.max(x + 3, webScrollX + 3) : null;
                      const stickyLabelMaxW =
                        stickyLabelLeft !== null ? Math.max(0, x + w - stickyLabelLeft - 3) : 0;
                      const labelTopPos =
                        maxLines === 1 ? barTop + barHeight / 2 - lblSize / 2 : barTop + 4;
                      // Expand thin bars to a >=44px touch target via hitSlop,
                      // without changing the visual bar width.
                      const hSlop = Math.max(0, (MIN_HIT_PX - w) / 2);
                      return (
                        <React.Fragment key={ev.id}>
                          <Pressable
                            onPress={() => handleTap(ev)}
                            hitSlop={{ left: hSlop, right: hSlop, top: 4, bottom: 4 }}
                            accessibilityRole="button"
                            accessibilityLabel={ev.title}
                            style={
                              {
                                position: 'absolute',
                                left: x,
                                top: barTop,
                                width: w,
                                height: barHeight,
                                backgroundColor: eventColor(ev),
                                borderRadius: 3,
                                cursor: 'pointer',
                              } as any
                            }
                          />
                          {stickyLabelLeft !== null && stickyLabelMaxW > 4 && lblSize > 0 && (
                            <View
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                left: stickyLabelLeft,
                                top: labelTopPos,
                                maxWidth: stickyLabelMaxW,
                              }}
                            >
                              <Text
                                numberOfLines={maxLines}
                                ellipsizeMode="tail"
                                style={{
                                  ...typography.caption,
                                  fontSize: lblSize,
                                  color: colors.textPrimary,
                                }}
                              >
                                {ev.title}
                              </Text>
                            </View>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </View>
                );
              })}
              <View
                style={{
                  position: 'absolute',
                  left: heuteWebX - 0.75,
                  top: 0,
                  width: 1.5,
                  height: canvasHeight,
                  backgroundColor: '#FF5050',
                  pointerEvents: 'none',
                }}
              />
            </View>
          </ScrollView>
        </View>
        <View
          style={[
            styles.zoomButtons,
            Platform.select({ web: { position: 'fixed', right: 12, bottom: 12 } as any }),
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} accessibilityLabel="Zoom in">
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} accessibilityLabel="Zoom out">
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Native (Skia) ────────────────────────────────────────────────────────
  return (
    <View>
      <View style={styles.axisRow}>
        <View style={{ width: LANE_LABEL_WIDTH }} />
        <TimeAxis
          offsetX={jsOffsetX}
          pixelsPerUnit={jsPixelsPerUnit}
          canvasWidth={canvasWidth}
          zoomLevel={zoomLevel}
        />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ZoomLevelIndicator zoomLevel={zoomLevel} />
          <TimelineBreadcrumb
            startYear={viewportRange.startYear}
            endYear={viewportRange.endYear}
            epoch={epochLabel}
          />
        </View>
      </View>

      <TimelineMinimap
        offsetX={jsOffsetX}
        pixelsPerUnit={jsPixelsPerUnit}
        canvasWidth={canvasWidth}
        onJump={handleMinimapJump}
      />
      <EpochJumpBar onJump={zoomToFit} />

      <View style={styles.container}>
        <View style={styles.labels}>
          {lanes.map((cat, idx) => {
            const overflow = overflowCounts.get(cat) ?? 0;
            return (
              <View
                key={cat}
                style={[
                  styles.label,
                  {
                    top: laneTops[idx],
                    height: laneHeightForTracks(laneTrackCounts.get(cat) ?? 1),
                    borderLeftColor: colors.category[cat],
                  },
                ]}
              >
                <Text style={styles.labelText}>{t(`category.${cat}`)}</Text>
                {overflow > 0 && (
                  <Text style={styles.clusterBadge}>+{overflow}</Text>
                )}
              </View>
            );
          })}
        </View>

        <GestureDetector gesture={gesture}>
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                const laneH = laneHeightForTracks(laneTrackCounts.get(cat) ?? 1);
                // Clip to MAX_EVENTS_PER_LANE; excess is shown as badge in lane label.
                const events = (visibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
                const trackMap = tracksByLane.get(cat);
                return (
                  <Group key={cat}>
                    <Rect
                      x={0}
                      y={laneTop}
                      width={canvasWidth}
                      height={laneH}
                      color={colors.laneBg[cat]}
                    />
                    {events.map((ev) => {
                      const startT = yearToT(ev.startYear);
                      const endT = yearToT(ev.endYear ?? ev.startYear);
                      const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                      const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                      const trackIdx = trackMap?.get(ev.id) ?? 0;
                      const barY = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                      const barH = TRACK_HEIGHT - 8;
                      return (
                        <Rect
                          key={ev.id}
                          x={x}
                          y={barY}
                          width={w}
                          height={barH}
                          color={eventColor(ev)}
                        />
                      );
                    })}
                  </Group>
                );
              })}
              {heuteVisible && (
                <Rect
                  x={heutePx - 0.75}
                  y={0}
                  width={1.5}
                  height={canvasHeight}
                  color="rgba(255, 80, 80, 0.9)"
                />
              )}
            </Canvas>

            {/* Labels only; taps are handled by the GestureDetector hit-test. */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {lanes.map((cat, idx) => {
                const laneTop = laneTops[idx] ?? 0;
                // Cap to match the Skia bar-drawing loop so labels only appear over real bars.
                const events = (visibleByLane.get(cat) ?? []).slice(0, MAX_EVENTS_PER_LANE);
                const trackMap = tracksByLane.get(cat);
                const lblSize = eventLabelFontSize(zoomLevel);
                const maxLines = eventLabelMaxLines(zoomLevel);
                return [
                  ...events.map((ev) => {
                    if (!labelVisibleIds.has(ev.id)) return null;
                    if (lblSize === 0) return null;
                    const startT = yearToT(ev.startYear);
                    const endT = yearToT(ev.endYear ?? ev.startYear);
                    const x = (startT - jsOffsetX) * jsPixelsPerUnit;
                    const w = Math.max(2, (endT - startT) * jsPixelsPerUnit);
                    if (x + w < 0 || x > canvasWidth) return null;
                    const trackIdx = trackMap?.get(ev.id) ?? 0;
                    const barY = laneTop + LANE_PADDING_V + trackIdx * TRACK_HEIGHT + 4;
                    const barH = TRACK_HEIGHT - 8;
                    const labelTop =
                      maxLines === 1 ? barY + barH / 2 - lblSize / 2 : barY + 4;
                    return (
                      <View
                        key={`lbl-${ev.id}`}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: Math.max(x, 0) + 3,
                          top: labelTop,
                          maxWidth: Math.max(0, Math.min(x + w, canvasWidth) - Math.max(x, 0) - 6),
                        }}
                      >
                        <Text
                          style={{
                            ...typography.caption,
                            fontSize: lblSize,
                            color: colors.textPrimary,
                          }}
                          numberOfLines={maxLines}
                          ellipsizeMode="tail"
                        >
                          {ev.title}
                        </Text>
                      </View>
                    );
                  }),
                ];
              })}
            </View>
          </View>
        </GestureDetector>
      </View>
      <View style={styles.zoomButtons} pointerEvents="box-none">
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn} accessibilityLabel="Zoom in">
          <Text style={styles.zoomBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut} accessibilityLabel="Zoom out">
          <Text style={styles.zoomBtnText}>−</Text>
        </TouchableOpacity>
      </View>

      {popoverState && (
        <>
          {/* Transparent backdrop — tap outside closes the popover */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPopoverState(null)}
            accessible={false}
          />
          <View
            style={[
              styles.popover,
              {
                // px is in canvas coords; add LANE_LABEL_WIDTH to convert to
                // screen coords, then clamp to [0, right edge - popover width].
                left: Math.max(
                  0,
                  Math.min(
                    popoverState.x + LANE_LABEL_WIDTH,
                    canvasWidth + LANE_LABEL_WIDTH - POPOVER_MAX_WIDTH,
                  ),
                ),
                // Clamp vertically so the popover stays inside the canvas area.
                top: Math.max(
                  0,
                  Math.min(popoverState.y - 8, canvasHeight - POPOVER_MAX_HEIGHT),
                ),
              },
            ]}
          >
            <Text style={styles.popoverTitle}>{t('popover.title')}</Text>
            {popoverState.events.map((ev) => (
              <Pressable
                key={ev.id}
                style={styles.popoverItem}
                onPress={() => {
                  setPopoverState(null);
                  zoomToFit(ev.startYear, ev.endYear);
                  setPendingSelectEvent(ev);
                }}
                accessibilityRole="button"
                accessibilityLabel={ev.title}
              >
                <View style={[styles.popoverDot, { backgroundColor: eventColor(ev) }]} />
                <Text style={styles.popoverText} numberOfLines={1}>
                  {ev.title}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.popoverDismiss}
              onPress={() => setPopoverState(null)}
              accessibilityLabel={t('popover.dismiss')}
            >
              <Text style={styles.popoverDismissText}>✕</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  axisRow: {
    flexDirection: 'row',
  },
  container: {
    flexDirection: 'row',
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
  clusterBadge: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  zoomButtons: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'column',
    gap: 6,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(31, 36, 45, 0.90)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  popover: {
    position: 'absolute',
    minWidth: 160,
    maxWidth: POPOVER_MAX_WIDTH,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    zIndex: 100,
    ...shadows.md,
  },
  popoverTitle: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    gap: 8,
  },
  popoverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  popoverText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  popoverDismiss: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  popoverDismissText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
