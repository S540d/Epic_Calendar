import type { ZoomLevel } from '@/data/schema';
import { yearToT } from './scale';

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

export const ZOOM_LEVEL_NAMES: Record<ZoomLevel, string> = {
  0: 'Äonen',
  1: 'Ären',
  2: 'Epochen',
  3: 'Jahrhunderte',
  4: 'Jahre',
};

// Full timeline: Big Bang (−13.8 Gyr) to present.
const T_MIN = yearToT(-13_800_000_000);
const T_MAX = yearToT(2026);
export const FULL_T_SPAN = T_MAX - T_MIN;

/**
 * Returns the initial offsetX and pixelsPerUnit that fit the entire timeline
 * (Big Bang → present) within canvasWidth pixels.
 */
export function defaultViewState(canvasWidth: number): { offsetX: number; pixelsPerUnit: number } {
  return {
    offsetX: T_MIN,
    pixelsPerUnit: canvasWidth / FULL_T_SPAN,
  };
}

// Lowered from 30 to 10 to allow the full-overview zoom level.
export const MIN_PIXELS_PER_UNIT = 10;
export const MAX_PIXELS_PER_UNIT = 8000;

export function clampPixelsPerUnit(v: number): number {
  return Math.max(MIN_PIXELS_PER_UNIT, Math.min(MAX_PIXELS_PER_UNIT, v));
}
