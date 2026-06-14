/**
 * Time ↔ pixel mapping for the timeline.
 *
 * The timeline spans roughly the Big Bang to "now" (~13.8 Gyr). A purely
 * linear pixel mapping is unusable across this range. We therefore use a
 * symmetric log transform around `referenceYear = 0` (year 0 CE):
 *
 *   t(year) = sign(year) * log10(1 + |year|)
 *
 * The viewport then maps a linear pixel offset onto this `t` space, with
 * `pixelsPerUnit` (the zoom level) controlling density.
 *
 * This means equal pixel distances near year 0 correspond to small
 * intervals (years), and equal distances far from 0 correspond to large
 * intervals (millions of years) — which matches human intuition about
 * the relative "importance" of recent vs. deep history.
 */

export const REFERENCE_YEAR = 0;

/**
 * Canonical timeline span endpoints. Single source of truth — do NOT redefine
 * these (or their `yearToT` projections) in components or other modules.
 *
 * - `BIG_BANG_YEAR`: left edge of the full timeline (~13.8 Gyr ago).
 * - `PRESENT_YEAR`:  right edge ("Heute" / now).
 */
export const BIG_BANG_YEAR = -13_800_000_000;
export const PRESENT_YEAR = 2026;

/** Projected `t` value of the timeline left edge (Big Bang). */
export const T_MIN = yearToT(BIG_BANG_YEAR);
/** Projected `t` value of the timeline right edge (present). */
export const T_MAX = yearToT(PRESENT_YEAR);
/** Alias for the present-day `t` value (== `T_MAX`). */
export const T_PRESENT = T_MAX;
/** Total length of the full timeline in `t`-units. */
export const FULL_T_SPAN = T_MAX - T_MIN;

export function yearToT(year: number): number {
  const delta = year - REFERENCE_YEAR;
  const sign = delta >= 0 ? 1 : -1;
  return sign * Math.log10(1 + Math.abs(delta));
}

export function tToYear(t: number): number {
  const sign = t >= 0 ? 1 : -1;
  return REFERENCE_YEAR + sign * (Math.pow(10, Math.abs(t)) - 1);
}

export function yearToPixel(year: number, offsetX: number, pixelsPerUnit: number): number {
  return (yearToT(year) - offsetX) * pixelsPerUnit;
}

export function pixelToYear(px: number, offsetX: number, pixelsPerUnit: number): number {
  return tToYear(px / pixelsPerUnit + offsetX);
}

/** Visible year-range for a viewport in pixels [0, width]. */
export function viewportYearRange(
  width: number,
  offsetX: number,
  pixelsPerUnit: number,
): { startYear: number; endYear: number } {
  return {
    startYear: pixelToYear(0, offsetX, pixelsPerUnit),
    endYear: pixelToYear(width, offsetX, pixelsPerUnit),
  };
}
