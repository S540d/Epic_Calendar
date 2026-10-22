import type { TimelineEvent } from '@/data/schema';

export type JourneyStripLayout = {
  /** Left edge of the strip in years (earliest station). */
  startYear: number;
  /** Right edge of the strip in years (latest station end). */
  endYear: number;
  /** Marker position per station, 0..1, same order as the input events. */
  positions: number[];
};

/**
 * Lays out a journey's stations on a strictly linear mini-timeline whose span
 * is derived from the stations themselves (dynamic: a 50-year journey and a
 * 4-billion-year journey both fill the whole strip). Stations that are close in
 * time may overlap; that is the honest linear picture.
 */
export function layoutJourneyStrip(events: readonly TimelineEvent[]): JourneyStripLayout | null {
  if (events.length === 0) return null;

  const startYear = Math.min(...events.map((e) => e.startYear));
  const endYear = Math.max(...events.map((e) => e.endYear ?? e.startYear));
  const span = endYear - startYear;

  const positions = events.map((e) => (span > 0 ? (e.startYear - startYear) / span : 0.5));
  return { startYear, endYear, positions };
}

/** Minimum width zoom-to-fit gives a point event (mirrors `useTimelineViewport`). */
const POINT_SPAN_YEARS = 200;
/** The fit range may be at most this many times wider than the station itself. */
export const MAX_CONTEXT_FACTOR = 50;

/**
 * Year range the main timeline shows for a journey station: the station plus
 * its neighbours, but never wider than `MAX_CONTEXT_FACTOR` × the station's own
 * span. Beyond that the station would shrink to a speck, so far-away neighbours
 * are clipped (symmetrically around the station) instead of pulled into view.
 */
export function journeyFitRange(
  event: TimelineEvent,
  neighbours: readonly TimelineEvent[],
  maxFactor: number = MAX_CONTEXT_FACTOR,
): { startYear: number; endYear: number } {
  const eventEnd = event.endYear ?? event.startYear;
  const all = [event, ...neighbours];
  let startYear = Math.min(...all.map((e) => e.startYear));
  let endYear = Math.max(...all.map((e) => e.endYear ?? e.startYear));

  const cap = Math.max(eventEnd - event.startYear, POINT_SPAN_YEARS) * maxFactor;
  if (endYear - startYear > cap) {
    const center = (event.startYear + eventEnd) / 2;
    startYear = Math.max(startYear, center - cap / 2);
    endYear = Math.min(endYear, center + cap / 2);
  }
  return { startYear, endYear };
}
