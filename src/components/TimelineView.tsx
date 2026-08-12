import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, useWindowDimensions, type ScrollView } from 'react-native';

import { ALL_EVENTS } from '@/data/events';
import { buildStableTracksByLane, computeLaneData, type TrackMap } from '@/timeline/culling';
import { buildEventIndex } from '@/timeline/eventIndex';
import { useTimelineViewport } from './useTimelineViewport';
import { useTimelineGestures } from './useTimelineGestures';
import { TimelineCanvasWeb } from './TimelineCanvasWeb';
import { TimelineCanvasNative, type PopoverState } from './TimelineCanvasNative';
import {
  computeLabelVisibleIds,
  laneHeightForTracks,
  MAX_EVENTS_PER_LANE,
  MIN_HIT_PX,
} from './timelineRenderShared';
import { viewportYearRange, yearToT, T_PRESENT as T_HEUTE } from '@/timeline/scale';
import {
  IMPORTANCE_RANK,
  type Continent,
  type ImportanceLevel,
  type TimelineEvent,
} from '@/data/schema';
import {
  LANE_GAP,
  LANE_LABEL_WIDTH,
  LANE_PADDING_V,
  TRACK_HEIGHT,
  type Category,
} from '@/theme/tokens';
import { LANE_ORDER } from '@/theme/categories';

type Props = {
  activeCategories: Set<Category>;
  continent: Continent;
  /** Cumulative detail tier; higher tiers reveal more events. */
  detailLevel?: ImportanceLevel;
  onSelectEvent: (event: TimelineEvent) => void;
  /** Increment to animate back to the default human-history view. */
  resetKey?: number;
  /** Shows the live FPS overlay (#5 FPS-Monitoring, opt-in via Settings). */
  showFpsMonitor?: boolean;
  /** When set, the timeline animates to this epoch after mount. */
  epochRange?: { startYear: number; endYear: number };
  /**
   * Set (e.g. from search) to zoom-to-fit a specific event and open its
   * detail modal. `requestId` must change on every jump request (even to the
   * same event) so repeated searches for the same event still re-trigger the
   * animation. Does not change the active category/continent filter itself —
   * the caller must ensure the event is visible under the current filters.
   */
  jumpToEvent?: { event: TimelineEvent; requestId: number } | null;
  /**
   * Set (e.g. from search) to center the viewport on a specific year without
   * opening a detail modal. Same `requestId` re-trigger semantics as `jumpToEvent`.
   */
  jumpToYear?: { year: number; requestId: number } | null;
  /**
   * Ref to the parent ScrollView (mobile vertical scroll between lanes).
   * Wired into the pan gesture so RNGH yields vertical drags to it instead
   * of racing it for the touch (see #161).
   */
  scrollRef?: React.RefObject<ScrollView | null>;
};

/** Imperative zoom/pan commands exposed to the parent (e.g. a fixed zoom-button overlay
 *  rendered outside the scrolling container — see TimelineScreen). */
export type TimelineViewHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  jumpToToday: () => void;
};

// Built once at module load from the static event set — avoids O(n) full scans per frame.
const eventIndex = buildEventIndex(ALL_EVENTS);

/** Delay before opening the detail modal after the zoom-to-fit animation (600 ms). */
const ZOOM_MODAL_DELAY_MS = 650;

export const TimelineView = forwardRef<TimelineViewHandle, Props>(function TimelineView(
  {
    activeCategories,
    continent,
    detailLevel = 'detail',
    onSelectEvent,
    resetKey = 0,
    showFpsMonitor = false,
    epochRange,
    jumpToEvent,
    jumpToYear,
    scrollRef,
  }: Props,
  ref,
) {
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = Math.max(0, screenWidth - LANE_LABEL_WIDTH);

  // Popover shown when a tap hits multiple overlapping events (#35)
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);
  // Close the disambiguation popover whenever the viewport moves.
  const closePopover = useCallback(() => setPopoverState(null), []);

  // Viewport state + zoom/pan/jump commands (platform-aware, see hook).
  const {
    offsetX,
    pixelsPerUnit,
    startOffsetX,
    startPixelsPerUnit,
    startFocalT,
    jsOffsetX,
    jsPixelsPerUnit,
    zoomLevel,
    zoomToFit,
    zoomAtPoint,
    zoomIn,
    zoomOut,
    jumpToToday,
    handleMinimapJump,
  } = useTimelineViewport({
    canvasWidth,
    resetKey,
    onViewportMove: closePopover,
  });

  useImperativeHandle(ref, () => ({ zoomIn, zoomOut, jumpToToday }), [
    zoomIn,
    zoomOut,
    jumpToToday,
  ]);

  // Event queued to open after the zoom-to-fit animation completes (#44).
  const [pendingSelectEvent, setPendingSelectEvent] = useState<TimelineEvent | null>(null);

  // Stable snapshot of all hit-test inputs, updated after every render so that
  // handleCanvasTap (memoized with []) always reads up-to-date data.
  const tapDataRef = useRef({
    lanes: [] as Category[],
    laneTops: [] as number[],
    laneTrackCounts: new Map<Category, number>(),
    visibleByLane: new Map<Category, TimelineEvent[]>(),
    tracksByLane: new Map<Category, TrackMap>(),
    jsOffsetX,
    jsPixelsPerUnit,
  });

  // Stable ref to the latest zoomToFit closure so handleCanvasTap doesn't need it as dep.
  const zoomToFitRef = useRef<
    (startYear: number, endYear: number | null | undefined, webAnimated?: boolean) => void
  >(() => {});

  // Stable ref to onSelectEvent so the pending-modal timer doesn't restart if the
  // parent recreates the callback while a zoom animation is in progress.
  const onSelectEventRef = useRef(onSelectEvent);
  useLayoutEffect(() => {
    onSelectEventRef.current = onSelectEvent;
  }, [onSelectEvent]);

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

  const lanes = useMemo(
    () => LANE_ORDER.filter((c) => activeCategories.has(c)),
    [activeCategories],
  );

  const maxImportanceRank = IMPORTANCE_RANK[detailLevel];

  // Viewport-independent track assignment per lane (#146 B1) — recomputed only
  // when the filtered event set changes (continent/detail/active lanes), NOT on
  // every pan/zoom frame. Keeps an event's row stable while scrolling.
  const stableTracksByLane = useMemo(
    () => buildStableTracksByLane(lanes, continent, maxImportanceRank, eventIndex),
    [lanes, continent, maxImportanceRank],
  );

  // Lane data for both web and native — driven by jsOffsetX (viewport-relative).
  const laneData = useMemo(() => {
    const range = viewportYearRange(canvasWidth, jsOffsetX, jsPixelsPerUnit);
    return computeLaneData({
      events: ALL_EVENTS,
      startYear: range.startYear,
      endYear: range.endYear,
      zoomLevel,
      lanes,
      continent,
      maxEventsPerLane: MAX_EVENTS_PER_LANE,
      maxImportanceRank,
      eventIndex,
      stableTracksByLane,
    });
  }, [
    canvasWidth,
    jsOffsetX,
    jsPixelsPerUnit,
    lanes,
    zoomLevel,
    continent,
    maxImportanceRank,
    stableTracksByLane,
  ]);
  const { visibleByLane, overflowCounts, tracksByLane, connectorsByLane } = laneData;

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

  const heutePx = useMemo(
    () => (T_HEUTE - jsOffsetX) * jsPixelsPerUnit,
    [jsOffsetX, jsPixelsPerUnit],
  );
  const heuteVisible = heutePx >= -1 && heutePx <= canvasWidth + 1;

  // Canvas-space hit-test (native). Enforces a minimum 44px hit-box per event.
  // If exactly one event is hit, selects it immediately.
  // If multiple events overlap at the tap position, shows a disambiguation popover.
  // Stable (empty deps): reads current render data via tapDataRef, calls zoomToFit via zoomToFitRef.
  const handleCanvasTap = useCallback((px: number, py: number) => {
    const {
      lanes,
      laneTops,
      laneTrackCounts,
      visibleByLane,
      tracksByLane,
      jsOffsetX,
      jsPixelsPerUnit,
    } = tapDataRef.current;
    const candidates: { ev: TimelineEvent; dist: number }[] = [];
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

  const gesture = useTimelineGestures({
    canvasWidth,
    offsetX,
    pixelsPerUnit,
    startOffsetX,
    startPixelsPerUnit,
    startFocalT,
    onTap: handleCanvasTap,
    zoomAtPoint,
    scrollRef,
  });

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

  // tapDataRef: update every render so handleCanvasTap always reads current viewport state.
  useLayoutEffect(() => {
    Object.assign(tapDataRef.current, {
      lanes,
      laneTops,
      laneTrackCounts,
      visibleByLane,
      tracksByLane,
      jsOffsetX,
      jsPixelsPerUnit,
    });
  });
  // zoomToFitRef: only update when zoomToFit rebuilds (on canvasWidth resize).
  useLayoutEffect(() => {
    zoomToFitRef.current = zoomToFit;
  }, [zoomToFit]);

  // Minimap highlight: set while the epoch zoom-in animation is in progress.
  const [minimapHighlight, setMinimapHighlight] = useState<{
    startT: number;
    endT: number;
  } | null>(null);

  // Animate to the selected epoch when epochRange changes. Waits for a valid
  // canvasWidth so zoomToFit computes correct PPU. The lastZoomedEpochRef guards
  // against re-firing on window resize without blocking subsequent epoch changes.
  const lastZoomedEpochRef = useRef<{ startYear: number; endYear: number } | null>(null);
  useEffect(() => {
    if (!epochRange) return;
    if (canvasWidth <= 0) return;
    const last = lastZoomedEpochRef.current;
    if (last?.startYear === epochRange.startYear && last?.endYear === epochRange.endYear) return;
    lastZoomedEpochRef.current = epochRange;
    // Show minimap highlight immediately so the user sees the target before zoom.
    setMinimapHighlight({
      startT: yearToT(epochRange.startYear),
      endT: yearToT(epochRange.endYear),
    });
    const zoomTimer = setTimeout(() => {
      zoomToFitRef.current(epochRange.startYear, epochRange.endYear, true);
    }, 100);
    const clearTimer = setTimeout(() => setMinimapHighlight(null), 450);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(clearTimer);
    };
  }, [epochRange, canvasWidth]);

  // Jump to a specific event (e.g. from search, #146 A). Keyed on requestId
  // (not event.id) so repeated jumps to the same event still re-trigger the
  // animation. Reuses the same zoom-to-fit + minimap highlight + delayed
  // detail-modal pattern as epoch jumps and tap-to-select.
  const lastJumpRequestIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!jumpToEvent) return;
    if (canvasWidth <= 0) return;
    if (lastJumpRequestIdRef.current === jumpToEvent.requestId) return;
    lastJumpRequestIdRef.current = jumpToEvent.requestId;
    const { event } = jumpToEvent;
    setMinimapHighlight({
      startT: yearToT(event.startYear),
      endT: yearToT(event.endYear ?? event.startYear),
    });
    const zoomTimer = setTimeout(() => {
      zoomToFitRef.current(event.startYear, event.endYear, true);
      setPendingSelectEvent(event);
    }, 100);
    const clearTimer = setTimeout(() => setMinimapHighlight(null), 450);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(clearTimer);
    };
  }, [jumpToEvent, canvasWidth]);

  // Jump to a bare year (e.g. "gehe zu 1848" in search, #146 A) — same pattern
  // as jumpToEvent but without a detail modal at the end.
  const lastYearJumpRequestIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!jumpToYear) return;
    if (canvasWidth <= 0) return;
    if (lastYearJumpRequestIdRef.current === jumpToYear.requestId) return;
    lastYearJumpRequestIdRef.current = jumpToYear.requestId;
    const { year } = jumpToYear;
    setMinimapHighlight({ startT: yearToT(year), endT: yearToT(year) });
    const zoomTimer = setTimeout(() => {
      zoomToFitRef.current(year, undefined, true);
    }, 100);
    const clearTimer = setTimeout(() => setMinimapHighlight(null), 450);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(clearTimer);
    };
  }, [jumpToYear, canvasWidth]);

  // Tap on a web event bar → zoom to fit + queue the detail modal.
  const handleEventTap = useCallback(
    (event: TimelineEvent) => {
      zoomToFit(event.startYear, event.endYear);
      setPendingSelectEvent(event);
    },
    [zoomToFit],
  );

  // Tap on a popover entry (native multi-hit) → close, zoom, queue modal.
  const handlePopoverSelect = useCallback(
    (event: TimelineEvent) => {
      setPopoverState(null);
      zoomToFit(event.startYear, event.endYear);
      setPendingSelectEvent(event);
    },
    [zoomToFit],
  );

  if (Platform.OS === 'web') {
    return (
      <TimelineCanvasWeb
        lanes={lanes}
        laneTops={laneTops}
        laneTrackCounts={laneTrackCounts}
        visibleByLane={visibleByLane}
        tracksByLane={tracksByLane}
        connectorsByLane={connectorsByLane}
        overflowCounts={overflowCounts}
        labelVisibleIds={labelVisibleIds}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        jsOffsetX={jsOffsetX}
        jsPixelsPerUnit={jsPixelsPerUnit}
        offsetX={offsetX}
        pixelsPerUnit={pixelsPerUnit}
        gesture={gesture}
        zoomLevel={zoomLevel}
        zoomAtPoint={zoomAtPoint}
        onEventTap={handleEventTap}
        zoomToFit={zoomToFit}
        handleMinimapJump={handleMinimapJump}
        viewportRange={viewportRange}
        minimapHighlight={minimapHighlight}
        showFpsMonitor={showFpsMonitor}
      />
    );
  }

  return (
    <TimelineCanvasNative
      lanes={lanes}
      laneTops={laneTops}
      laneTrackCounts={laneTrackCounts}
      visibleByLane={visibleByLane}
      tracksByLane={tracksByLane}
      connectorsByLane={connectorsByLane}
      overflowCounts={overflowCounts}
      labelVisibleIds={labelVisibleIds}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      jsOffsetX={jsOffsetX}
      jsPixelsPerUnit={jsPixelsPerUnit}
      zoomLevel={zoomLevel}
      viewportRange={viewportRange}
      heutePx={heutePx}
      heuteVisible={heuteVisible}
      gesture={gesture}
      zoomToFit={zoomToFit}
      handleMinimapJump={handleMinimapJump}
      popoverState={popoverState}
      onPopoverClose={closePopover}
      onPopoverSelect={handlePopoverSelect}
      minimapHighlight={minimapHighlight}
      showFpsMonitor={showFpsMonitor}
    />
  );
});
