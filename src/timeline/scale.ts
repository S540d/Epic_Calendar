/**
 * Time ↔ pixel mapping for the timeline.
 *
 * Phase 2 (Issue #93): viewport-local linear mapping (Modell B).
 *
 *   t(year) = year  (identity)
 *
 * `pixelsPerUnit` is now pixels-per-year, and `offsetX` is directly a year
 * value. The full 5 Gyr span is deliberately NOT displayed in the main view;
 * users navigate deep time via the Landing Page epoch tiles.
 */

/**
 * Canonical timeline span endpoints. Single source of truth — do NOT redefine
 * these (or their `yearToT` projections) in components or other modules.
 *
 * - `TIMELINE_START_YEAR`: left edge of the timeline. We start at −5 Gyr (just
 *   before Earth formed, ~−4.6 Gyr) rather than the Big Bang: scrolling further
 *   back into the pre-Earth era carries no events of interest.
 * - `PRESENT_YEAR`:  right edge ("Heute" / now).
 */
export const TIMELINE_START_YEAR = -5_000_000_000;
/** @deprecated use TIMELINE_START_YEAR — kept as an alias for compatibility. */
export const BIG_BANG_YEAR = TIMELINE_START_YEAR;
export const PRESENT_YEAR = 2026;

/** Projected `t` value of the timeline left edge. */
export const T_MIN = yearToT(TIMELINE_START_YEAR);
/** Projected `t` value of the timeline right edge (present). */
export const T_MAX = yearToT(PRESENT_YEAR);
/** Alias for the present-day `t` value (== `T_MAX`). */
export const T_PRESENT = T_MAX;
/** Total length of the full timeline in `t`-units. */
export const FULL_T_SPAN = T_MAX - T_MIN;

/** Identity transform: t equals year directly (linear scale). */
export function yearToT(year: number): number {
  return year;
}

/** Identity transform: year equals t directly (linear scale). */
export function tToYear(t: number): number {
  return t;
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
