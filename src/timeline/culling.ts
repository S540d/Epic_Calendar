import type { TimelineEvent, ZoomLevel, Continent } from '@/data/schema';
import type { Category } from '@/theme/tokens';

export type TrackMap = Map<string, number>; // eventId → trackIndex (0-based)

/**
 * Assigns each event to the lowest-numbered track where no previously
 * assigned event overlaps it (greedy interval packing).
 * Respects manual event.track overrides.
 */
export function assignTracks(events: TimelineEvent[]): TrackMap {
  const sorted = [...events].sort((a, b) => a.startYear - b.startYear);
  const trackEndYears: number[] = [];
  const result = new Map<string, number>();

  for (const ev of sorted) {
    if (ev.track !== undefined) {
      result.set(ev.id, ev.track);
      while (trackEndYears.length <= ev.track) trackEndYears.push(-Infinity);
      const evEnd = ev.endYear ?? ev.startYear;
      if (evEnd > (trackEndYears[ev.track] ?? -Infinity)) trackEndYears[ev.track] = evEnd;
      continue;
    }
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
};

/**
 * Computes visibility, overflow and track data for every active lane in one
 * pass. Shared by the web and native render paths — they only differ in how
 * the visible year range is derived, which is passed in here.
 */
export function computeLaneData(input: LaneDataInput): LaneData {
  const { events, startYear, endYear, zoomLevel, lanes, continent, maxEventsPerLane } = input;
  const visibleByLane = new Map<Category, TimelineEvent[]>();
  const overflowCounts = new Map<Category, number>();
  const tracksByLane = new Map<Category, TrackMap>();

  for (const cat of lanes) {
    const visible = filterVisible(events, {
      startYear,
      endYear,
      zoomLevel,
      categories: new Set<Category>([cat]),
      continent,
    });
    visibleByLane.set(cat, visible);
    if (visible.length > maxEventsPerLane) {
      overflowCounts.set(cat, visible.length - maxEventsPerLane);
    }
    // Only assign tracks for the capped set so layout stays predictable.
    tracksByLane.set(cat, assignTracks(visible.slice(0, maxEventsPerLane)));
  }

  return { visibleByLane, overflowCounts, tracksByLane };
}
