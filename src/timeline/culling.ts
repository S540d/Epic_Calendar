import type { TimelineEvent, ZoomLevel, Continent } from '@/data/schema';
import type { Category } from '@/theme/tokens';
import type { EventIndex } from './eventIndex';

export type TrackMap = Map<string, number>; // eventId → trackIndex (0-based)

/**
 * Assigns each event to the lowest-numbered track where no previously
 * assigned event overlaps it (greedy interval packing).
 *
 * Three-phase algorithm:
 *   Phase 0 – manual event.track overrides (highest priority)
 *   Phase 1 – lineage groups: all events sharing a lineageId go to the same
 *             track; the full span (first→last event) is reserved so that
 *             unrelated events cannot displace successors mid-lineage.
 *   Phase 2 – remaining singletons (greedy, same as before)
 */
export function assignTracks(events: TimelineEvent[]): TrackMap {
  const result = new Map<string, number>();
  const trackEndYears: number[] = [];

  const manualEvents: TimelineEvent[] = [];
  const lineageMap = new Map<string, TimelineEvent[]>();
  const singletons: TimelineEvent[] = [];

  for (const ev of events) {
    if (ev.track !== undefined) {
      manualEvents.push(ev);
    } else if (ev.lineageId) {
      const group = lineageMap.get(ev.lineageId) ?? [];
      group.push(ev);
      lineageMap.set(ev.lineageId, group);
    } else {
      singletons.push(ev);
    }
  }

  // Phase 0: manual overrides
  for (const ev of manualEvents) {
    result.set(ev.id, ev.track!);
    while (trackEndYears.length <= ev.track!) trackEndYears.push(-Infinity);
    const evEnd = ev.endYear ?? ev.startYear;
    if (evEnd > (trackEndYears[ev.track!] ?? -Infinity)) trackEndYears[ev.track!] = evEnd;
  }

  // Phase 1: lineage groups – reserve the full span of the group on one track
  const sortedGroups = [...lineageMap.values()]
    .map((g) => g.slice().sort((a, b) => a.startYear - b.startYear))
    .sort((a, b) => a[0].startYear - b[0].startYear);

  for (const group of sortedGroups) {
    const firstStart = group[0].startYear;
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
      trackEndYears.push(-Infinity);
    }
    // Reserve the full lineage span so singletons cannot displace successors
    trackEndYears[assigned] = lastEnd;
    for (const ev of group) {
      result.set(ev.id, assigned);
    }
  }

  // Phase 2: singletons – greedy interval packing
  singletons.sort((a, b) => a.startYear - b.startYear);
  for (const ev of singletons) {
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
      result.set(ev.id, trackEndYears.length);
      trackEndYears.push(evEnd);
    }
  }

  return result;
}

export type VisibilityFilter = {
  startYear: number;
  endYear: number;
  zoomLevel: ZoomLevel;
  categories: Set<Category>;
  continent: Continent;
};

export function filterVisible(events: TimelineEvent[], f: VisibilityFilter): TimelineEvent[] {
  const result: TimelineEvent[] = [];
  for (const ev of events) {
    if (!f.categories.has(ev.category)) continue;
    if (ev.continent !== 'global' && ev.continent !== f.continent) continue;
    if (ev.minZoomLevel > f.zoomLevel) continue;
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
  /** Optional pre-built index for O(hits + log n) queries instead of O(n) full scan. */
  eventIndex?: EventIndex;
};

/**
 * Computes visibility, overflow and track data for every active lane in one
 * pass. Shared by the web and native render paths — they only differ in how
 * the visible year range is derived, which is passed in here.
 */
export function computeLaneData(input: LaneDataInput): LaneData {
  const { events, startYear, endYear, zoomLevel, lanes, continent, maxEventsPerLane, eventIndex } =
    input;
  const visibleByLane = new Map<Category, TimelineEvent[]>();
  const overflowCounts = new Map<Category, number>();
  const tracksByLane = new Map<Category, TrackMap>();

  for (const cat of lanes) {
    const query = {
      startYear,
      endYear,
      zoomLevel,
      categories: new Set<Category>([cat]),
      continent,
    };
    const visible = eventIndex ? eventIndex.queryVisible(query) : filterVisible(events, query);
    visibleByLane.set(cat, visible);
    if (visible.length > maxEventsPerLane) {
      overflowCounts.set(cat, visible.length - maxEventsPerLane);
    }
    // Only assign tracks for the capped set so layout stays predictable.
    tracksByLane.set(cat, assignTracks(visible.slice(0, maxEventsPerLane)));
  }

  return { visibleByLane, overflowCounts, tracksByLane };
}
