import type { Category } from '@/theme/tokens';
import { PRESENT_YEAR } from './scale';

/**
 * A navigable epoch. Single source of truth for every epoch-shaped UI:
 * the landing-page tiles, the EpochBand under the axis and the breadcrumb bar.
 *
 * Invariants (enforced by the data-integrity tests in `__tests__/epoch.test.ts`):
 * `startYear < endYear`, keys are globally unique, and a node's children tile
 * their parent exactly — no gaps, no overlaps, first child starts where the
 * parent starts, last child ends where it ends.
 */
export type NavigationEpoch = {
  /** i18n key suffix: `epochNav.<key>`. */
  readonly key: string;
  readonly startYear: number;
  readonly endYear: number;
  /** Hex colour, shared by the band segment, the tile accent and the crumb dot. */
  readonly color: string;
  /**
   * Categories shown while travelling through this epoch from the landing
   * page (#279). Set on the roots only; sub-epochs inherit their root's set.
   */
  readonly categories?: readonly Category[];
  readonly children?: readonly NavigationEpoch[];
};

/** Deep time: geology and nature only — no humans to show yet. */
const EARTH_CATEGORIES: readonly Category[] = ['erdzeitalter', 'natur'];
/**
 * Human history: everything except the geological periods (a single
 * "Quartär/Holozän" bar carries no information here). `natur` stays —
 * for this era it's science & technology (printing press, Newton, vaccines).
 */
const HUMAN_CATEGORIES: readonly Category[] = [
  'zivilisation',
  'natur',
  'nation',
  'herrscher',
  'kultur',
];

export const NAVIGATION_EPOCHS: readonly NavigationEpoch[] = [
  {
    key: 'cosmicDawn',
    startYear: -13_800_000_000,
    endYear: -4_600_000_000,
    color: '#6B4BB8',
    categories: EARTH_CATEGORIES,
  },
  {
    key: 'earlyEarth',
    startYear: -4_600_000_000,
    endYear: -541_000_000,
    color: '#4A8FA8',
    categories: EARTH_CATEGORIES,
  },
  {
    key: 'paleozoic',
    startYear: -541_000_000,
    endYear: -252_000_000,
    color: '#4FA86A',
    categories: EARTH_CATEGORIES,
  },
  {
    key: 'mesozoic',
    startYear: -252_000_000,
    endYear: -66_000_000,
    color: '#B87C3A',
    categories: EARTH_CATEGORIES,
  },
  {
    key: 'cenozoic',
    startYear: -66_000_000,
    endYear: -2_580_000,
    color: '#7C9CFF',
    categories: EARTH_CATEGORIES,
  },
  {
    key: 'humanHistory',
    startYear: -2_580_000,
    endYear: PRESENT_YEAR,
    color: '#C28B4A',
    categories: HUMAN_CATEGORIES,
    children: [
      { key: 'stoneAge', startYear: -2_580_000, endYear: -10_000, color: '#8E9E6A' },
      { key: 'ancientCiv', startYear: -10_000, endYear: -800, color: '#B88B4A' },
      {
        key: 'antiquity',
        startYear: -800,
        endYear: 600,
        color: '#C28B4A',
        children: [
          { key: 'earlyAntiquity', startYear: -800, endYear: -323, color: '#D4A055' },
          { key: 'hellenism', startYear: -323, endYear: -27, color: '#C8955A' },
          { key: 'lateAntiquity', startYear: -27, endYear: 600, color: '#B87848' },
        ],
      },
      {
        key: 'middleAges',
        startYear: 600,
        endYear: 1500,
        color: '#A07040',
        children: [
          { key: 'earlyMiddleAges', startYear: 600, endYear: 1000, color: '#9A7A50' },
          { key: 'highMiddleAges', startYear: 1000, endYear: 1250, color: '#907060' },
          { key: 'lateMiddleAges', startYear: 1250, endYear: 1500, color: '#806050' },
        ],
      },
      {
        key: 'modern',
        startYear: 1500,
        endYear: PRESENT_YEAR,
        color: '#CF8A30',
        children: [
          { key: 'earlyModern', startYear: 1500, endYear: 1800, color: '#D4943A' },
          { key: 'industrial', startYear: 1800, endYear: 1950, color: '#C48030' },
          { key: 'contemporary', startYear: 1950, endYear: PRESENT_YEAR, color: '#BA7020' },
        ],
      },
    ],
  },
];

/** Every node of the tree, parents before their children (20 entries). */
export function flattenEpochs(
  roots: readonly NavigationEpoch[] = NAVIGATION_EPOCHS,
): NavigationEpoch[] {
  const out: NavigationEpoch[] = [];
  for (const node of roots) {
    out.push(node);
    if (node.children) out.push(...flattenEpochs(node.children));
  }
  return out;
}

/** Deepest level the tree offers; `epochsAtDepth` saturates beyond this. */
export const MAX_EPOCH_DEPTH = 2;

export type EpochDepth = 0 | 1 | 2;

/**
 * The tree sliced at `depth`, with fill semantics: a node that bottoms out
 * before `depth` represents itself, so every slice covers the full timeline
 * without gaps or overlaps. Yields 6 / 10 / 16 segments for depth 0 / 1 / 2.
 */
export function epochsAtDepth(
  depth: EpochDepth,
  roots: readonly NavigationEpoch[] = NAVIGATION_EPOCHS,
): readonly NavigationEpoch[] {
  const out: NavigationEpoch[] = [];
  for (const node of roots) {
    if (depth === 0 || !node.children?.length) out.push(node);
    else out.push(...epochsAtDepth((depth - 1) as EpochDepth, node.children));
  }
  return out;
}

// Precomputed: the EpochBand re-renders on every pan frame and must not
// re-flatten the tree each time.
export const EPOCHS_DEPTH_0 = epochsAtDepth(0);
export const EPOCHS_DEPTH_1 = epochsAtDepth(1);
export const EPOCHS_DEPTH_2 = epochsAtDepth(2);

const EPOCHS_BY_DEPTH = [EPOCHS_DEPTH_0, EPOCHS_DEPTH_1, EPOCHS_DEPTH_2] as const;

/** Precomputed slice for `depth` — prefer this over calling `epochsAtDepth` per frame. */
export function epochsAtDepthCached(depth: EpochDepth): readonly NavigationEpoch[] {
  return EPOCHS_BY_DEPTH[depth];
}

/**
 * Which tree level the EpochBand should render for a given visible span.
 *
 * Derived from the span in years rather than the LOD `zoomLevel`, because the
 * LOD thresholds are calibrated for event density, not epoch granularity. The
 * cutoffs keep segments wide enough to still carry a readable label.
 */
export function epochBandDepth(visibleSpanYears: number): EpochDepth {
  if (visibleSpanYears > 1_000_000) return 0;
  if (visibleSpanYears > 3_000) return 1;
  return 2;
}

/**
 * Epochs the EpochBand shows for a viewport: its tree level for the visible
 * span, limited to segments overlapping the viewport by at least
 * `minOverlapYears` (so a sliver too narrow to carry a label doesn't count).
 */
export function bandEpochsInView(
  startYear: number,
  endYear: number,
  minOverlapYears = 0,
): NavigationEpoch[] {
  return epochsAtDepthCached(epochBandDepth(endYear - startYear)).filter(
    (ep) =>
      Math.min(endYear, ep.endYear) - Math.max(startYear, ep.startYear) >
      Math.max(0, minOverlapYears),
  );
}

/**
 * True when `year` falls inside `epoch`. Ranges are half-open on the right so a
 * year sitting exactly on a shared boundary (600, 1500) belongs to the *later*
 * epoch — "the year 1500 is Neuzeit", matching how the axis reads. The very end
 * of the timeline is the exception: PRESENT_YEAR must still resolve into
 * `contemporary` rather than falling out of the tree.
 */
function contains(epoch: NavigationEpoch, year: number): boolean {
  if (year >= epoch.startYear && year < epoch.endYear) return true;
  return year === epoch.endYear && epoch.endYear >= PRESENT_YEAR;
}

/**
 * Ancestor chain from the root down to the deepest epoch containing `year`,
 * e.g. year -300 → [humanHistory, antiquity, hellenism]. Returns `[]` when the
 * year lies outside every root (before the Big Bang, or in the future).
 */
export function epochPathAt(year: number): NavigationEpoch[] {
  const path: NavigationEpoch[] = [];
  let level: readonly NavigationEpoch[] | undefined = NAVIGATION_EPOCHS;

  while (level?.length) {
    const match: NavigationEpoch | undefined = level.find((ep) => contains(ep, year));
    if (!match) break;
    path.push(match);
    level = match.children;
  }
  return path;
}

/**
 * Minimum share of the visible span an epoch must cover to be claimed as the
 * current one. Without it a fully zoomed-out viewport would report "Hellenismus"
 * merely because the centre pixel happens to land there.
 */
export const MIN_CRUMB_COVERAGE = 0.5;

/**
 * Breadcrumb path for a viewport. Descends via the centre year but stops as soon
 * as a candidate covers less than {@link MIN_CRUMB_COVERAGE} of the visible span,
 * so the trail stays honest about how far in the user actually is. Keeps at
 * least the outermost crumb — a coarse label beats an empty one.
 */
export function epochPathForViewport(startYear: number, endYear: number): NavigationEpoch[] {
  const span = endYear - startYear;
  const full = epochPathAt((startYear + endYear) / 2);
  if (span <= 0 || full.length === 0) return full;

  const path: NavigationEpoch[] = [];
  for (const epoch of full) {
    const overlap = Math.min(endYear, epoch.endYear) - Math.max(startYear, epoch.startYear);
    if (path.length > 0 && overlap / span < MIN_CRUMB_COVERAGE) break;
    path.push(epoch);
  }
  return path;
}

/**
 * Categories for a time journey over `[startYear, endYear)` (#279): the union
 * of the `categories` of every root epoch the range overlaps. A range inside
 * one root (any landing-page tile) gets exactly that root's set; a range
 * spanning deep time and human history gets both.
 */
export function categoriesForEpochRange(startYear: number, endYear: number): Set<Category> {
  const out = new Set<Category>();
  for (const root of NAVIGATION_EPOCHS) {
    if (root.startYear < endYear && root.endYear > startYear) {
      for (const cat of root.categories ?? []) out.add(cat);
    }
  }
  return out;
}
