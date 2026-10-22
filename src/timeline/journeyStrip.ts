import type { TimelineEvent } from '@/data/schema';

/** Minimum horizontal distance between two station markers, as fraction of the strip. */
export const MIN_STATION_GAP = 0.06;

export type JourneyStripLayout = {
  /** Left edge of the strip in years (earliest station). */
  startYear: number;
  /** Right edge of the strip in years (latest station end). */
  endYear: number;
  /** Marker position per station, 0..1, same order as the input events. */
  positions: number[];
};

/**
 * Lays out a journey's stations on a linear mini-timeline whose span is derived
 * from the stations themselves (dynamic: a 50-year journey and a 4-billion-year
 * journey both fill the whole strip).
 *
 * Linear placement keeps true time proportions, but stations that are close in
 * time would overlap into an untappable blob. `minGap` pushes neighbours apart
 * (order is preserved); when there is not enough room for all markers at that
 * gap, they fall back to equal spacing.
 */
export function layoutJourneyStrip(
  events: readonly TimelineEvent[],
  minGap: number = MIN_STATION_GAP,
): JourneyStripLayout | null {
  if (events.length === 0) return null;

  const startYear = Math.min(...events.map((e) => e.startYear));
  const endYear = Math.max(...events.map((e) => e.endYear ?? e.startYear));
  const span = endYear - startYear;
  const n = events.length;

  if (n === 1) return { startYear, endYear, positions: [0.5] };

  const equal = events.map((_, i) => i / (n - 1));
  if (span <= 0 || (n - 1) * minGap >= 1) return { startYear, endYear, positions: equal };

  const positions = events.map((e) => (e.startYear - startYear) / span);

  // Forward pass: enforce the gap towards the right.
  let prev = -Infinity;
  const pushed = positions.map((p) => (prev = Math.max(p, prev + minGap)));
  // Backward pass: pull anything pushed past the right edge back in.
  let next = Infinity;
  for (let i = n - 1; i >= 0; i--) {
    next = Math.min(pushed[i] ?? 0, i === n - 1 ? 1 : next - minGap);
    pushed[i] = next;
  }

  return { startYear, endYear, positions: pushed };
}
