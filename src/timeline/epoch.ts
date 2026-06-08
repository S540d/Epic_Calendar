import { ALL_EVENTS } from '@/data/events';
import type { TimelineEvent } from '@/data/schema';

/**
 * Returns the most specific geological era ('erdzeitalter') that contains the
 * given year, used to give the viewport an "epoch context" beyond the raw
 * date range (e.g. "Mesozoikum", "Holozän").
 *
 * "Most specific" = smallest span among all containing eras, so finer
 * subdivisions (Mesozoikum) win over their broad parent (Phanerozoikum).
 * Returns null when no era covers the year (e.g. before the Hadaikum).
 */
export function dominantEpoch(
  centerYear: number,
  events: TimelineEvent[] = ALL_EVENTS,
): TimelineEvent | null {
  let best: TimelineEvent | null = null;
  let bestSpan = Infinity;
  for (const ev of events) {
    if (ev.category !== 'erdzeitalter') continue;
    const start = ev.startYear;
    const end = ev.endYear ?? ev.startYear;
    if (centerYear >= start && centerYear <= end) {
      const span = end - start;
      if (span < bestSpan) {
        bestSpan = span;
        best = ev;
      }
    }
  }
  return best;
}
