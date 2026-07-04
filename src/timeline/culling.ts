import {
  passesImportance,
  type TimelineEvent,
  type ZoomLevel,
  type Continent,
} from '@/data/schema';
import type { Category } from '@/theme/tokens';
import type { EventIndex } from './eventIndex';

export type TrackMap = Map<string, number>; // eventId → trackIndex (0-based)

/**
 * Assigns each event to the lowest-numbered track where no previously
 * assigned event overlaps it (greedy interval packing).
 *
 * Four-phase algorithm:
 *   Phase 0 – manual event.track overrides (highest priority)
 *   Phase 1 – lineage groups: all events sharing a lineageId go to the same
 *             track; the full span (first→last event) is reserved so that
 *             unrelated events cannot displace successors mid-lineage.
 *   Phase 2 – singletons WITH a `culture`: prefer a track that already holds
 *             an event of the same culture (if it fits, no overlap), so
 *             culturally related events cluster into one visual row even
 *             without an explicit `lineageId` (#146 B2). Falls back to the
 *             lowest free track when no same-culture track has room.
 *   Phase 3 – remaining singletons without `culture` (greedy, same as before)
 */
export function assignTracks(events: TimelineEvent[]): TrackMap {
  const result = new Map<string, number>();
  const trackEndYears: number[] = [];
  const trackCultures: Set<string>[] = [];

  const manualEvents: TimelineEvent[] = [];
  const lineageMap = new Map<string, TimelineEvent[]>();
  const singletonsWithCulture: TimelineEvent[] = [];
  const singletonsWithoutCulture: TimelineEvent[] = [];

  for (const ev of events) {
    if (ev.track !== undefined) {
      manualEvents.push(ev);
    } else if (ev.lineageId) {
      const group = lineageMap.get(ev.lineageId) ?? [];
      group.push(ev);
      lineageMap.set(ev.lineageId, group);
    } else if (ev.culture) {
      singletonsWithCulture.push(ev);
    } else {
      singletonsWithoutCulture.push(ev);
    }
  }

  function ensureTrackSlot(t: number): void {
    while (trackEndYears.length <= t) {
      trackEndYears.push(-Infinity);
      trackCultures.push(new Set());
    }
  }

  // Phase 0: manual overrides
  for (const ev of manualEvents) {
    result.set(ev.id, ev.track!);
    ensureTrackSlot(ev.track!);
    const evEnd = ev.endYear ?? ev.startYear;
    if (evEnd > (trackEndYears[ev.track!] ?? -Infinity)) trackEndYears[ev.track!] = evEnd;
    if (ev.culture) trackCultures[ev.track!]!.add(ev.culture);
  }

  // Phase 1: lineage groups – reserve the full span of the group on one track
  const sortedGroups = [...lineageMap.values()]
    .map((g) => g.slice().sort((a, b) => a.startYear - b.startYear))
    .sort((a, b) => {
      const aG = a[0]!.continent === 'global' ? 0 : 1;
      const bG = b[0]!.continent === 'global' ? 0 : 1;
      if (aG !== bG) return aG - bG;
      return a[0]!.startYear - b[0]!.startYear;
    });

  for (const group of sortedGroups) {
    const firstStart = group[0]!.startYear;
    const lastEnd = group.reduce((max, ev) => Math.max(max, ev.endYear ?? ev.startYear), -Infinity);

    let assigned = -1;
    for (let t = 0; t < trackEndYears.length; t++) {
      if ((trackEndYears[t] ?? -Infinity) <= firstStart) {
        assigned = t;
        break;
      }
    }
    if (assigned === -1) {
      assigned = trackEndYears.length;
      ensureTrackSlot(assigned);
    }
    // Reserve the full lineage span so singletons cannot displace successors
    trackEndYears[assigned] = lastEnd;
    for (const ev of group) {
      result.set(ev.id, assigned);
      if (ev.culture) trackCultures[assigned]!.add(ev.culture);
    }
  }

  // Phase 2: singletons with a culture – prefer a same-culture track with room.
  singletonsWithCulture.sort((a, b) => {
    const aG = a.continent === 'global' ? 0 : 1;
    const bG = b.continent === 'global' ? 0 : 1;
    if (aG !== bG) return aG - bG;
    return a.startYear - b.startYear;
  });
  for (const ev of singletonsWithCulture) {
    const evEnd = ev.endYear ?? ev.startYear;
    let placed = false;

    // First pass: a track already holding the same culture, with room.
    for (let t = 0; t < trackEndYears.length; t++) {
      if (trackCultures[t]!.has(ev.culture!) && (trackEndYears[t] ?? -Infinity) <= ev.startYear) {
        trackEndYears[t] = evEnd;
        trackCultures[t]!.add(ev.culture!);
        result.set(ev.id, t);
        placed = true;
        break;
      }
    }
    // Fallback: lowest free track, same as culture-agnostic singletons.
    if (!placed) {
      for (let t = 0; t < trackEndYears.length; t++) {
        if ((trackEndYears[t] ?? -Infinity) <= ev.startYear) {
          trackEndYears[t] = evEnd;
          trackCultures[t]!.add(ev.culture!);
          result.set(ev.id, t);
          placed = true;
          break;
        }
      }
    }
    if (!placed) {
      const t = trackEndYears.length;
      ensureTrackSlot(t);
      trackEndYears[t] = evEnd;
      trackCultures[t]!.add(ev.culture!);
      result.set(ev.id, t);
    }
  }

  // Phase 3: singletons without a culture – greedy interval packing.
  singletonsWithoutCulture.sort((a, b) => {
    const aG = a.continent === 'global' ? 0 : 1;
    const bG = b.continent === 'global' ? 0 : 1;
    if (aG !== bG) return aG - bG;
    return a.startYear - b.startYear;
  });
  for (const ev of singletonsWithoutCulture) {
    const evEnd = ev.endYear ?? ev.startYear;
    let placed = false;
    for (let t = 0; t < trackEndYears.length; t++) {
      if ((trackEndYears[t] ?? -Infinity) <= ev.startYear) {
        trackEndYears[t] = evEnd;
        result.set(ev.id, t);
        placed = true;
        break;
      }
    }
    if (!placed) {
      const t = trackEndYears.length;
      ensureTrackSlot(t);
      trackEndYears[t] = evEnd;
      result.set(ev.id, t);
    }
  }

  return result;
}

/** A continuation line between two successive events sharing a lineage. */
export type LineageConnector = {
  lineageId: string;
  /** End year of the predecessor (where the line starts). */
  fromYear: number;
  /** Start year of the successor (where the line ends). */
  toYear: number;
  track: number;
};

/**
 * Builds continuation lines between consecutive events that share a `lineageId`
 * and sit on the same track. Only gaps (`toYear > fromYear`) produce a
 * connector — overlapping or back-to-back successors need no line.
 */
export function computeLineageConnectors(
  events: TimelineEvent[],
  trackMap: TrackMap,
): LineageConnector[] {
  // Group events that have a lineageId AND a rendered track by lineageId.
  const byLineage = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    if (ev.lineageId === undefined) continue;
    if (trackMap.get(ev.id) === undefined) continue; // beyond cap — no bar drawn
    let arr = byLineage.get(ev.lineageId);
    if (!arr) {
      arr = [];
      byLineage.set(ev.lineageId, arr);
    }
    arr.push(ev);
  }

  const connectors: LineageConnector[] = [];
  for (const [lineageId, group] of byLineage) {
    group.sort((a, b) => a.startYear - b.startYear);
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1]!;
      const next = group[i]!;
      const prevTrack = trackMap.get(prev.id)!;
      const nextTrack = trackMap.get(next.id)!;
      if (prevTrack !== nextTrack) continue; // only connect within one row
      const fromYear = prev.endYear ?? prev.startYear;
      const toYear = next.startYear;
      if (toYear <= fromYear) continue; // overlap / no gap → no line
      connectors.push({ lineageId, fromYear, toYear, track: prevTrack });
    }
  }
  return connectors;
}

export type VisibilityFilter = {
  startYear: number;
  endYear: number;
  zoomLevel: ZoomLevel;
  categories: Set<Category>;
  continent: Continent;
  /** Highest importance rank to show (cumulative). Default 2 (= show all). */
  maxImportanceRank?: number;
};

export function filterVisible(events: TimelineEvent[], f: VisibilityFilter): TimelineEvent[] {
  const maxImportanceRank = f.maxImportanceRank ?? 2;
  const result: TimelineEvent[] = [];
  for (const ev of events) {
    if (!f.categories.has(ev.category)) continue;
    if (ev.continent !== 'global' && ev.continent !== f.continent) continue;
    if (ev.minZoomLevel > f.zoomLevel) continue;
    if (!passesImportance(ev, maxImportanceRank)) continue;
    const evStart = ev.startYear;
    const evEnd = ev.endYear ?? ev.startYear;
    // Overlap test with viewport.
    if (evEnd < f.startYear) continue;
    if (evStart > f.endYear) continue;
    result.push(ev);
  }
  return result;
}

/** Per-lane visibility, overflow and track data for one viewport. */
export type LaneData = {
  /** Events overlapping the viewport, per lane (uncapped). */
  visibleByLane: Map<Category, TimelineEvent[]>;
  /** Events hidden per lane because the lane exceeds `maxEventsPerLane`. */
  overflowCounts: Map<Category, number>;
  /** Track assignment per lane, computed on the capped event set. */
  tracksByLane: Map<Category, TrackMap>;
  /** Lineage continuation lines per lane, computed on the capped event set. */
  connectorsByLane: Map<Category, LineageConnector[]>;
};

export type LaneDataInput = {
  events: TimelineEvent[];
  /** Visible year range of the current viewport. */
  startYear: number;
  endYear: number;
  zoomLevel: ZoomLevel;
  /** Active lanes (categories), in render order. */
  lanes: Category[];
  continent: Continent;
  /** Cap on rendered events per lane; excess is counted into `overflowCounts`. */
  maxEventsPerLane: number;
  /** Highest importance rank to show (cumulative). Default 2 (= show all). */
  maxImportanceRank?: number;
  /** Optional pre-built index for O(hits + log n) queries instead of O(n) full scan. */
  eventIndex?: EventIndex;
  /**
   * Pre-computed, viewport-independent track assignment per lane (see
   * `buildStableTracksByLane`). When provided, `computeLaneData` looks up track
   * numbers here instead of recomputing them from the visible-in-viewport set —
   * this keeps an event's row stable while panning/zooming. Falls back to the
   * old per-viewport `assignTracks(capped)` behavior when omitted (e.g. tests).
   */
  stableTracksByLane?: Map<Category, TrackMap>;
};

/**
 * Computes track assignments once per lane over the *full* filtered event set
 * (continent + importance, no year range) so that an event's row never changes
 * while panning/zooming — only which rows are currently scrolled into view
 * changes. Must be recomputed when `continent`, `maxImportanceRank` or `lanes`
 * change, but NOT on viewport (offset/zoom) changes.
 */
export function buildStableTracksByLane(
  lanes: Category[],
  continent: Continent,
  maxImportanceRank: number | undefined,
  eventIndex: EventIndex,
): Map<Category, TrackMap> {
  const tracksByLane = new Map<Category, TrackMap>();
  for (const cat of lanes) {
    const all = eventIndex.getFilteredCategory({ category: cat, continent, maxImportanceRank });
    tracksByLane.set(cat, assignTracks(all));
  }
  return tracksByLane;
}

/**
 * Computes visibility, overflow and track data for every active lane in one
 * pass. Shared by the web and native render paths — they only differ in how
 * the visible year range is derived, which is passed in here.
 */
export function computeLaneData(input: LaneDataInput): LaneData {
  const {
    events,
    startYear,
    endYear,
    zoomLevel,
    lanes,
    continent,
    maxEventsPerLane,
    maxImportanceRank,
    eventIndex,
    stableTracksByLane,
  } = input;
  const visibleByLane = new Map<Category, TimelineEvent[]>();
  const overflowCounts = new Map<Category, number>();
  const tracksByLane = new Map<Category, TrackMap>();
  const connectorsByLane = new Map<Category, LineageConnector[]>();

  for (const cat of lanes) {
    const query = {
      startYear,
      endYear,
      zoomLevel,
      categories: new Set<Category>([cat]),
      continent,
      maxImportanceRank,
    };
    const visible = eventIndex ? eventIndex.queryVisible(query) : filterVisible(events, query);
    visibleByLane.set(cat, visible);
    if (visible.length > maxEventsPerLane) {
      overflowCounts.set(cat, visible.length - maxEventsPerLane);
    }

    const stableTracks = stableTracksByLane?.get(cat);
    if (stableTracks) {
      // Rows come from the pre-computed, viewport-independent assignment.
      // Cap by dropping the events with the highest global row numbers first,
      // so the rendered set stays the lowest-numbered (most "important" /
      // earliest-placed) rows rather than an arbitrary viewport-order slice.
      const sortedByGlobalTrack = visible
        .slice()
        .sort(
          (a, b) => (stableTracks.get(a.id) ?? Infinity) - (stableTracks.get(b.id) ?? Infinity),
        );
      const capped = sortedByGlobalTrack.slice(0, maxEventsPerLane);

      // Remap global track numbers to a dense 0..k range for rendering, so a
      // lane with e.g. only rows {3, 7} visible in this viewport still renders
      // 2 compact rows instead of 8 (which would blow up lane height). Order
      // is preserved (relative row order never changes), only gaps collapse —
      // this keeps rows stable across pans while avoiding runaway lane height.
      const usedGlobalTracks = [...new Set(capped.map((ev) => stableTracks.get(ev.id)))]
        .filter((t): t is number => t !== undefined)
        .sort((a, b) => a - b);
      const denseTrack = new Map<number, number>();
      usedGlobalTracks.forEach((globalTrack, denseIdx) => denseTrack.set(globalTrack, denseIdx));

      const tracks: TrackMap = new Map();
      for (const ev of capped) {
        const globalTrack = stableTracks.get(ev.id);
        if (globalTrack === undefined) continue;
        tracks.set(ev.id, denseTrack.get(globalTrack)!);
      }
      tracksByLane.set(cat, tracks);
      connectorsByLane.set(cat, computeLineageConnectors(capped, tracks));
    } else {
      // Fallback: viewport-local track assignment (legacy behavior, still used by tests).
      const capped = visible.slice(0, maxEventsPerLane);
      const tracks = assignTracks(capped);
      tracksByLane.set(cat, tracks);
      connectorsByLane.set(cat, computeLineageConnectors(capped, tracks));
    }
  }

  return { visibleByLane, overflowCounts, tracksByLane, connectorsByLane };
}
