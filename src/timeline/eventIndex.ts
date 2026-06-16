import type { TimelineEvent, ZoomLevel, Continent } from '@/data/schema';
import type { Category } from '@/theme/tokens';

export type IndexQuery = {
  startYear: number;
  endYear: number;
  zoomLevel: ZoomLevel;
  categories: Set<Category>;
  continent: Continent;
};

/**
 * Category-partitioned, startYear-sorted index over a set of TimelineEvents.
 * Allows O(hits + log n) visibility queries vs. the O(n) full scan in filterVisible.
 */
export class EventIndex {
  private readonly byCategory: Map<Category, TimelineEvent[]>;

  constructor(events: TimelineEvent[]) {
    this.byCategory = new Map();
    for (const ev of events) {
      const cat = ev.category as Category;
      let arr = this.byCategory.get(cat);
      if (!arr) {
        arr = [];
        this.byCategory.set(cat, arr);
      }
      arr.push(ev);
    }
    for (const arr of this.byCategory.values()) {
      arr.sort((a, b) => a.startYear - b.startYear);
    }
  }

  queryVisible(query: IndexQuery): TimelineEvent[] {
    const { startYear, endYear, zoomLevel, categories, continent } = query;
    const result: TimelineEvent[] = [];

    for (const cat of categories) {
      const arr = this.byCategory.get(cat);
      if (!arr) continue;

      // Binary search: first index where startYear > viewportEnd.
      // Events from 0..hi-1 all start on or before the viewport ends.
      const hi = upperBound(arr, endYear);

      for (let i = 0; i < hi; i++) {
        const ev = arr[i]!;
        // Skip events that ended before the viewport starts.
        const evEnd = ev.endYear ?? ev.startYear;
        if (evEnd < startYear) continue;
        if (ev.continent !== 'global' && ev.continent !== continent) continue;
        if (ev.minZoomLevel > zoomLevel) continue;
        result.push(ev);
      }
    }

    return result;
  }
}

/** First index where arr[i].startYear > value (standard upper-bound binary search). */
function upperBound(arr: TimelineEvent[], value: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid]!.startYear <= value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function buildEventIndex(events: TimelineEvent[]): EventIndex {
  return new EventIndex(events);
}
