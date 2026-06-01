import type { ZoomLevel } from '@/data/schema';

/**
 * Map the current pixelsPerUnit (zoom density) to a discrete LOD band.
 * Bands are: 0 = Äonen, 1 = Ären, 2 = Epochen/Hochkulturen,
 * 3 = Jahrhunderte, 4 = Jahrzehnte/Jahre.
 *
 * Thresholds are tuned for a typical 360–430 px wide phone viewport.
 * `pixelsPerUnit` here refers to pixels per `t`-unit (see scale.ts).
 */
export function pixelsPerUnitToZoomLevel(pixelsPerUnit: number): ZoomLevel {
  if (pixelsPerUnit < 80) return 0;
  if (pixelsPerUnit < 200) return 1;
  if (pixelsPerUnit < 600) return 2;
  if (pixelsPerUnit < 2000) return 3;
  return 4;
}

export const MIN_PIXELS_PER_UNIT = 30;
export const MAX_PIXELS_PER_UNIT = 8000;

export function clampPixelsPerUnit(v: number): number {
  return Math.max(MIN_PIXELS_PER_UNIT, Math.min(MAX_PIXELS_PER_UNIT, v));
}
