import { CATEGORY_COLORS, CATEGORY_LANE_BG, type Category } from './categories';
import { eventColorFor } from './colorGeneration';

// Category and its registry live in `categories.ts` (single source of truth).
// Re-exported here so existing `@/theme/tokens` imports keep working.
export type { Category };

export const colors = {
  bg: '#0E1116',
  bgElevated: '#171B22',
  surface: '#1F242D',
  border: '#2A313C',
  textPrimary: '#F2F4F8',
  textSecondary: '#A8B0BB',
  textMuted: '#6B7280',
  accent: '#7C9CFF',
  category: CATEGORY_COLORS,
  laneBg: CATEGORY_LANE_BG,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const animation = {
  durationFast: 150,
  durationNormal: 250,
  durationSlow: 400,
};

export const zIndex = {
  base: 0,
  overlay: 10,
  modal: 20,
  tooltip: 30,
};

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const LANE_HEIGHT = 84;
export const LANE_GAP = 8;
export const LANE_LABEL_WIDTH = 28;
/** Height of a single track row within a multi-track lane. */
export const TRACK_HEIGHT = 80;
/** Vertical padding inside a lane (top + bottom combined). */
export const LANE_PADDING_V = 14;

/**
 * Returns a stable event color. Uses ev.color if set, otherwise generates a
 * deterministic tonal variation of the category's hue based on ev.culture
 * (see `colorGeneration.ts`). Events sharing the same culture get the same
 * color; events without a culture fall back to the flat category color.
 */
export function eventColor(ev: { color?: string; category: Category; culture?: string }): string {
  if (ev.color) return ev.color;
  const base = CATEGORY_COLORS[ev.category] ?? CATEGORY_COLORS.zivilisation;
  return eventColorFor(base, ev.culture);
}
