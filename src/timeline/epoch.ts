import { ALL_EVENTS } from '@/data/events';
import type { TimelineEvent } from '@/data/schema';

export type NavigationEpoch = {
  readonly key: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly children?: readonly NavigationEpoch[];
};

export const NAVIGATION_EPOCHS: readonly NavigationEpoch[] = [
  { key: 'cosmicDawn', startYear: -13_800_000_000, endYear: -4_600_000_000 },
  { key: 'earlyEarth', startYear: -4_600_000_000, endYear: -541_000_000 },
  { key: 'paleozoic', startYear: -541_000_000, endYear: -252_000_000 },
  { key: 'mesozoic', startYear: -252_000_000, endYear: -66_000_000 },
  { key: 'cenozoic', startYear: -66_000_000, endYear: -2_580_000 },
  {
    key: 'humanHistory',
    startYear: -2_580_000,
    endYear: 2026,
    children: [
      { key: 'stoneAge', startYear: -2_580_000, endYear: -10_000 },
      { key: 'ancientCiv', startYear: -10_000, endYear: -800 },
      {
        key: 'antiquity',
        startYear: -800,
        endYear: 600,
        children: [
          { key: 'earlyAntiquity', startYear: -800, endYear: -323 },
          { key: 'hellenism', startYear: -323, endYear: -27 },
          { key: 'lateAntiquity', startYear: -27, endYear: 600 },
        ],
      },
      {
        key: 'middleAges',
        startYear: 600,
        endYear: 1500,
        children: [
          { key: 'earlyMiddleAges', startYear: 600, endYear: 1000 },
          { key: 'highMiddleAges', startYear: 1000, endYear: 1250 },
          { key: 'lateMiddleAges', startYear: 1250, endYear: 1500 },
        ],
      },
      {
        key: 'modern',
        startYear: 1500,
        endYear: 2026,
        children: [
          { key: 'earlyModern', startYear: 1500, endYear: 1800 },
          { key: 'industrial', startYear: 1800, endYear: 1950 },
          { key: 'contemporary', startYear: 1950, endYear: 2026 },
        ],
      },
    ],
  },
];

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
