import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { ALL_EVENTS } from '@/data/events';
import { computeLaneData, type TrackMap } from '@/timeline/culling';
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
import {
  viewportYearRange,
  yearToT,
  tToYear,
  pixelToYear,
  T_MIN as TOTAL_T_MIN,
  T_PRESENT as T_HEUTE,
} from '@/timeline/scale';
import { dominantEpoch } from '@/timeline/epoch';
import { type Continent, type TimelineEvent } from '@/data/schema';
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
  onSelectEvent: (event: TimelineEvent) => void;
  /** Increment to animate back to the default human-history view. */
  resetKey?: number;
  /** When set, the timeline animates to this epoch after mount. */
  epochRange?: { startYear: number; endYear: number };
};

// Built once at module load from the static event set — avoids O(n) full scans per frame.
const eventIndex = buildEventIndex(ALL_EVENTS);

/** Delay before opening the detail modal after a zoom-to-fit animation.
 *  On web there is no animated zoom (direct PPU assignment), so a shorter
 *  delay covers the scroll animation only. */
const ZOOM_MODAL_DELAY_MS = Platform.OS === 'web' ? 350 : 650;

export function TimelineView({
  activeCategories,
  continent,
  onSelectEvent,
  resetKey = 0,
  epochRange,
}: Props) {
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
    webScrollX,
    commitScrollX,
    webScrollRef,
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

  // Native-path lane data. Shared computation in computeLaneData(); only the
  // visible year range differs from the web path (driven by jsOffsetX here).
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
      eventIndex,
    });
  }, [canvasWidth, jsOffsetX, jsPixelsPerUnit, lanes, zoomLevel, continent]);
  const { visibleByLane, overflowCounts, tracksByLane } = laneData;

  // Web-path lane data. Same computeLaneData() as native; only the visible year
  // range differs (derived from webScrollX). Empty on native (Platform.OS is a
  // compile-time constant, so the branch is dead-code-eliminated there).
  const webLaneData = useMemo(() => {
    if (Platform.OS !== 'web') {
      return {
        visibleByLane: new Map<Category, TimelineEvent[]>(),
        overflowCounts: new Map<Category, number>(),
        tracksByLane: new Map<Category, TrackMap>(),
      };
    }
    const webOffsetX = TOTAL_T_MIN + webScrollX / jsPixelsPerUnit;
    return computeLaneData({
      events: ALL_EVENTS,
      startYear: tToYear(webOffsetX),
      endYear: tToYear(webOffsetX + canvasWidth / jsPixelsPerUnit),
      zoomLevel,
      lanes,
      continent,
      maxEventsPerLane: MAX_EVENTS_PER_LANE,
      eventIndex,
    });
  }, [webScrollX, jsPixelsPerUnit, canvasWidth, lanes, zoomLevel, continent]);

  // On web the canvas renders from webLaneData (scroll-driven), so lane heights/
  // tops MUST come from the same track map — otherwise lanes overlap (e.g.
  // Nationen drawn over Zivilisationen). Native uses laneData (jsOffsetX).
  const effectiveTracksByLane = Platform.OS === 'web' ? webLaneData.tracksByLane : tracksByLane;

  const laneTrackCounts = useMemo(() => {
    const out = new Map<Category, number>();
    for (const [cat, tm] of effectiveTracksByLane) {
      const max = tm.size === 0 ? 0 : Math.max(...tm.values());
      out.set(cat, max + 1);
    }
    return out;
  }, [effectiveTracksByLane]);

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

  // Geological era label is only meaningful when the Erdzeitalter lane is shown.
  const showEpochLabel = activeCategories.has('erdzeitalter');
  const epochLabel = useMemo(() => {
    if (!showEpochLabel) return null;
    const centerYear = pixelToYear(canvasWidth / 2, jsOffsetX, jsPixelsPerUnit);
    return dominantEpoch(centerYear)?.title ?? null;
  }, [showEpochLabel, canvasWidth, jsOffsetX, jsPixelsPerUnit]);

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

  const gesture = useTimelineGestures({
    canvasWidth,
    offsetX,
    pixelsPerUnit,
    startOffsetX,
    startPixelsPerUnit,
    startFocalT,
    onTap: handleCanvasTap,
    zoomAtPoint,
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
        visibleByLane={webLaneData.visibleByLane}
        tracksByLane={webLaneData.tracksByLane}
        overflowCounts={webLaneData.overflowCounts}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        jsPixelsPerUnit={jsPixelsPerUnit}
        zoomLevel={zoomLevel}
        webScrollX={webScrollX}
        commitScrollX={commitScrollX}
        webScrollRef={webScrollRef}
        onEventTap={handleEventTap}
        zoomToFit={zoomToFit}
        handleMinimapJump={handleMinimapJump}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        jumpToToday={jumpToToday}
        showEpochLabel={showEpochLabel}
        minimapHighlight={minimapHighlight}
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
      overflowCounts={overflowCounts}
      labelVisibleIds={labelVisibleIds}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      jsOffsetX={jsOffsetX}
      jsPixelsPerUnit={jsPixelsPerUnit}
      zoomLevel={zoomLevel}
      viewportRange={viewportRange}
      epochLabel={epochLabel}
      heutePx={heutePx}
      heuteVisible={heuteVisible}
      gesture={gesture}
      zoomToFit={zoomToFit}
      handleMinimapJump={handleMinimapJump}
      zoomIn={zoomIn}
      zoomOut={zoomOut}
      jumpToToday={jumpToToday}
      popoverState={popoverState}
      onPopoverClose={closePopover}
      onPopoverSelect={handlePopoverSelect}
      minimapHighlight={minimapHighlight}
    />
  );
}
