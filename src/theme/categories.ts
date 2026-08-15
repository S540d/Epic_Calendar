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
  /** Solid accent color (chips, color bars, lane border). Also palette[0] (#162). */
  color: string;
  /** Translucent lane background fill. */
  laneBg: string;
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

/**
 * Per-culture color logic (#162): rather than hand-picking N hex values per
 * category (previously inconsistent lightness/saturation steps, no traceable
 * relationship between a culture's color and its neighbors), every palette is
 * *derived* from the category's single accent color via a fixed HSL formula.
 *
 * `generatePalette(base)` walks the accent color's hue/lightness outward in a
 * zigzag (0, +1, -1, +2, -2, …): index 0 is the accent color itself (so the
 * first culture hashed into a category renders in the category's signature
 * color), each further step nudges hue by `HUE_STEP_DEG` and lightness by
 * `LIGHTNESS_STEP_PCT` alternately lighter/darker, staying within the same
 * hue family so all variants read as "the same category" while remaining
 * distinguishable. Saturation is left untouched.
 */
const PALETTE_SIZE = 7;
const HUE_STEP_DEG = 6;
const LIGHTNESS_STEP_PCT = 9;
const LIGHTNESS_MIN_PCT = 12;
const LIGHTNESS_MAX_PCT = 88;
/** Zigzag walk outward from the base color: 0, +1, -1, +2, -2, … */
const PALETTE_OFFSETS = Array.from({ length: PALETTE_SIZE }, (_, i) =>
  i === 0 ? 0 : Math.ceil(i / 2) * (i % 2 === 0 ? -1 : 1),
);

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Deterministically derives a category's per-culture palette from its accent color. */
export function generatePalette(baseHex: string): readonly string[] {
  const { h, s, l } = hexToHsl(baseHex);
  return PALETTE_OFFSETS.map((k) => {
    const hue = (h + k * HUE_STEP_DEG + 360) % 360;
    const lightness = Math.min(
      LIGHTNESS_MAX_PCT,
      Math.max(LIGHTNESS_MIN_PCT, l + k * LIGHTNESS_STEP_PCT),
    );
    return hslToHex(hue, s, lightness);
  });
}

// Declaration order = VALID_CATEGORIES order (1:1 with the previous TS union).
const CATEGORY_LIST = [
  {
    id: 'erdzeitalter',
    color: '#4A8FA8',
    laneBg: 'rgba(74, 143, 168, 0.10)',
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
    labelKey: 'category.nation',
    chipOrder: 2,
    laneOrder: 3,
    enabled: true,
  },
  {
    id: 'herrscher',
    color: '#CF8A30',
    laneBg: 'rgba(207, 138, 48, 0.10)',
    labelKey: 'category.herrscher',
    chipOrder: 3,
    // Rendered as the bottom lane (finest detail below nations). The 116
    // herrscher events were previously invisible — chip present but no lane.
    laneOrder: 4,
    enabled: true,
  },
  {
    id: 'kultur',
    color: '#A85FC2',
    laneBg: 'rgba(168, 95, 194, 0.10)',
    labelKey: 'category.kultur',
    chipOrder: 5,
    laneOrder: 5,
    enabled: true,
  },
] as const satisfies readonly CategoryConfigBase[];

/** Category id union, derived from the registry. */
export type Category = (typeof CATEGORY_LIST)[number]['id'];

export type CategoryConfig = CategoryConfigBase & {
  id: Category;
  /** Distinct hues within the category's tonal range for per-culture coloring (#162: derived from `color`). */
  palette: readonly string[];
};

/** Ordered category configs (the single source of truth). Palettes are derived, not hand-picked (#162). */
export const CATEGORIES: readonly CategoryConfig[] = CATEGORY_LIST.map((c) => ({
  ...c,
  palette: generatePalette(c.color),
}));

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
const FALLBACK = CATEGORIES[0]!;

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
