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
