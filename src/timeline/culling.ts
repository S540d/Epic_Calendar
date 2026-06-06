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
