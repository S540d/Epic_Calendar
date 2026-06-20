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
 * Events sharing a `lineageId` (political successors, e.g. Merovingian →
 * Carolingian → Kingdom of France) are kept on the same track when free, so
 * they form a continuous lineage row. Respects manual event.track overrides.
 */
export function assignTracks(events: TimelineEvent[]): TrackMap {
  const sorted = [...events].sort((a, b) => a.startYear - b.startYear);
  const trackEndYears: number[] = [];
  const result = new Map<string, number>();
  // lineageId → track it was last placed on, to keep successors together.
  const lineageTrack = new Map<string, number>();

  for (const ev of sorted) {
    if (ev.track !== undefined) {
      result.set(ev.id, ev.track);
      while (trackEndYears.length <= ev.track) trackEndYears.push(-Infinity);
      const evEnd = ev.endYear ?? ev.startYear;
      if (evEnd > (trackEndYears[ev.track] ?? -Infinity)) trackEndYears[ev.track] = evEnd;
      if (ev.lineageId !== undefined) lineageTrack.set(ev.lineageId, ev.track);
      continue;
    }
    const evEnd = ev.endYear ?? ev.startYear;
    let placed = false;
    // Prefer the lineage's existing track if it is free (no overlap).
    if (ev.lineageId !== undefined) {
      const lt = lineageTrack.get(ev.lineageId);
      if (lt !== undefined && (trackEndYears[lt] ?? -Infinity) <= ev.startYear) {
        trackEndYears[lt] = evEnd;
        result.set(ev.id, lt);
        placed = true;
      }
    }
    for (let t = 0; !placed && t < trackEndYears.length; t++) {
      if ((trackEndYears[t] ?? -Infinity) <= ev.startYear) {
        trackEndYears[t] = evEnd;
        result.set(ev.id, t);
        placed = true;
        break;
      }
    }
    if (!placed) {
      result.set(ev.id, trackEndYears.length);
      trackEndYears.push(evEnd);
    }
    if (ev.lineageId !== undefined) lineageTrack.set(ev.lineageId, result.get(ev.id)!);
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
};

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
    // Only assign tracks for the capped set so layout stays predictable.
    const capped = visible.slice(0, maxEventsPerLane);
    const tracks = assignTracks(capped);
    tracksByLane.set(cat, tracks);
    connectorsByLane.set(cat, computeLineageConnectors(capped, tracks));
  }

  return { visibleByLane, overflowCounts, tracksByLane, connectorsByLane };
}
