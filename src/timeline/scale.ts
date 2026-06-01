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
