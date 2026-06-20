/**
 * Category registry — single source of truth for all event categories.
 *
 * Every category-derived value (colors, lane backgrounds, palettes, chip order,
 * lane order, defaults, disabled set, i18n label keys) is produced from the
 * ordered `CATEGORIES` config below. Adding a new category = a single entry here.
 *
 * NOTE: this module must NOT import from `tokens.ts` — `tokens.ts` re-exports
 * from here, so importing back would create a cycle.
 */

type CategoryConfigBase = {
  /** Stable identifier, also the i18n suffix and persistence key. */
  id: string;
  /** Solid accent color (chips, color bars, lane border). */
  color: string;
  /** Translucent lane background fill. */
  laneBg: string;
  /** Distinct hues within the category's tonal range for per-culture coloring. */
  palette: readonly string[];
  /** i18n key for the human-readable label. */
  labelKey: string;
  /** Position in the filter chip bar. Absent → not shown as a chip. */
  chipOrder?: number;
  /** Position as a timeline lane. Absent → never rendered as a lane. */
  laneOrder?: number;
  /** Whether the category is interactive (false → shown but disabled, e.g. "soon"). */
  enabled: boolean;
  /** Part of the default active selection on first launch. */
  defaultActive?: boolean;
  /** Known subgroups (formalized `culture` values). Reserved for later stages. */
  subcategories?: readonly string[];
};

// Declaration order = VALID_CATEGORIES order (1:1 with the previous TS union).
const CATEGORY_LIST = [
  {
    id: 'erdzeitalter',
    color: '#4A8FA8',
    laneBg: 'rgba(74, 143, 168, 0.10)',
    palette: ['#3D7A90', '#4E8FA8', '#2E6A7A', '#5FA5C2', '#1E5568', '#6BBAD4', '#357088'],
    labelKey: 'category.erdzeitalter',
    chipOrder: 0,
    laneOrder: 0,
    enabled: true,
    defaultActive: true,
  },
  {
    id: 'natur',
    color: '#4FA86A',
    laneBg: 'rgba(79, 168, 106, 0.10)',
    palette: ['#3D9957', '#5ABF72', '#2E7A45', '#7AD68A', '#4FB06A', '#236634', '#8FD4A0'],
    labelKey: 'category.natur',
    chipOrder: 4,
    laneOrder: 2,
    enabled: true,
    defaultActive: true,
  },
  {
    id: 'zivilisation',
    color: '#C28B4A',
    laneBg: 'rgba(194, 139, 74, 0.10)',
    palette: ['#B87C3A', '#D49A52', '#C86030', '#E8B468', '#A05C28', '#F0C878', '#7A4420'],
    labelKey: 'category.zivilisation',
    chipOrder: 1,
    laneOrder: 1,
    enabled: true,
    defaultActive: true,
  },
  {
    id: 'nation',
    color: '#7C9CFF',
    laneBg: 'rgba(124, 156, 255, 0.10)',
    palette: ['#5A7AE8', '#8AACFF', '#3A5CC4', '#7090D8', '#A0C0FF', '#4468B0', '#C0D4FF'],
    labelKey: 'category.nation',
    chipOrder: 2,
    laneOrder: 3,
    enabled: true,
  },
  {
    id: 'herrscher',
    color: '#CF8A30',
    laneBg: 'rgba(207, 138, 48, 0.10)',
    palette: ['#BF7020', '#D98C38', '#A05810', '#E8A050', '#8C4808', '#F0B868', '#704000'],
    labelKey: 'category.herrscher',
    // Quirk preserved: shown as a chip but has no lane (laneOrder absent).
    chipOrder: 3,
    enabled: true,
  },
] as const satisfies readonly CategoryConfigBase[];

/** Category id union, derived from the registry. */
export type Category = (typeof CATEGORY_LIST)[number]['id'];

export type CategoryConfig = CategoryConfigBase & { id: Category };

/** Ordered category configs (the single source of truth). */
export const CATEGORIES = CATEGORY_LIST as readonly CategoryConfig[];

const BY_ID = new Map<Category, CategoryConfig>(CATEGORIES.map((c) => [c.id, c]));

/** All valid category ids, in declaration order. */
export const VALID_CATEGORIES: readonly Category[] = CATEGORIES.map((c) => c.id);

/** Categories rendered as filter chips, in chip order. */
export const CHIP_CATEGORIES: readonly Category[] = CATEGORIES.filter(
  (c) => c.chipOrder !== undefined,
)
  .slice()
  .sort((a, b) => (a.chipOrder ?? 0) - (b.chipOrder ?? 0))
  .map((c) => c.id);

/** Categories rendered as timeline lanes, in lane order. */
export const LANE_ORDER: readonly Category[] = CATEGORIES.filter((c) => c.laneOrder !== undefined)
  .slice()
  .sort((a, b) => (a.laneOrder ?? 0) - (b.laneOrder ?? 0))
  .map((c) => c.id);

/** Default active selection on first launch. */
export const DEFAULT_CATEGORIES: readonly Category[] = CATEGORIES.filter(
  (c) => c.defaultActive,
).map((c) => c.id);

/** Categories shown but not interactive (e.g. "soon"). */
export const DISABLED_CATEGORIES: readonly Category[] = CATEGORIES.filter((c) => !c.enabled).map(
  (c) => c.id,
);

/** Lookup the full config for a category id. */
export function categoryConfig(id: Category): CategoryConfig | undefined {
  return BY_ID.get(id);
}

// Fallback config (first declared category) for unknown ids; the const tuple
// guarantees it is defined.
const FALLBACK = CATEGORY_LIST[0];

/** Solid accent color for a category. */
export function categoryColor(id: Category): string {
  return BY_ID.get(id)?.color ?? FALLBACK.color;
}

/** Translucent lane background for a category. */
export function categoryLaneBg(id: Category): string {
  return BY_ID.get(id)?.laneBg ?? FALLBACK.laneBg;
}

/** Per-culture color palette for a category. */
export function categoryPalette(id: Category): readonly string[] {
  return BY_ID.get(id)?.palette ?? FALLBACK.palette;
}

/** Map of category id → accent color. */
export const CATEGORY_COLORS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color])) as Record<
  Category,
  string
>;

/** Map of category id → lane background. */
export const CATEGORY_LANE_BG = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.laneBg]),
) as Record<Category, string>;

/** Map of category id → per-culture palette. */
export const CATEGORY_PALETTES = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.palette]),
) as Record<Category, readonly string[]>;
