import type { ZoomLevel } from '@/data/schema';
import { yearToT, T_MIN, T_MAX, FULL_T_SPAN } from './scale';

/**
 * LOD bands (pixels per year → discrete level).
 * Calibrated for the linear scale (Modell B, Phase 2 of Issue #93).
 *
 * Human history view (−400 000 → today) on a 375 px canvas gives
 * ppu ≈ 9.33e-4, which falls in band 2 "Epochen" — showing both
 * geological spans and major civilisations.
 *
 * Band boundaries:
 *   < 2e-6  → 0 (Äonen)        — billions of years visible
 *   < 5e-4  → 1 (Ären)         — millions of years visible
 *   < 0.02  → 2 (Epochen)      — human prehistory scale (~400k yrs)
 *   < 2     → 3 (Jahrhunderte) — millennia/centuries scale
 *   else    → 4 (Jahre)        — decades/individual years
 */
export function pixelsPerUnitToZoomLevel(pixelsPerUnit: number): ZoomLevel {
  if (pixelsPerUnit < 2e-6) return 0;
  if (pixelsPerUnit < 5e-4) return 1;
  if (pixelsPerUnit < 0.02) return 2;
  if (pixelsPerUnit < 2) return 3;
  return 4;
}

export const ZOOM_LEVEL_NAMES: Record<ZoomLevel, string> = {
  0: 'Äonen',
  1: 'Ären',
  2: 'Epochen',
  3: 'Jahrhunderte',
  4: 'Jahre',
};

const T_HUMAN_START = yearToT(-400_000);
export const HUMAN_T_SPAN = T_MAX - T_HUMAN_START;

// Re-export the canonical full-timeline span from scale (single source of truth).
export { T_MIN, T_MAX, FULL_T_SPAN };

/**
 * Default view: human prehistory (−400 000 years) to today.
 * "Heute" lands exactly at the right edge of the canvas.
 */
export function humanHistoryViewState(canvasWidth: number): {
  offsetX: number;
  pixelsPerUnit: number;
} {
  if (canvasWidth <= 0) return { offsetX: T_HUMAN_START, pixelsPerUnit: 1e-3 };
  return {
    offsetX: T_HUMAN_START,
    pixelsPerUnit: canvasWidth / HUMAN_T_SPAN,
  };
}

/** Full overview: Big Bang to present. */
export function defaultViewState(canvasWidth: number): { offsetX: number; pixelsPerUnit: number } {
  if (canvasWidth <= 0) return { offsetX: T_MIN, pixelsPerUnit: MIN_PIXELS_PER_UNIT };
  return {
    offsetX: T_MIN,
    pixelsPerUnit: canvasWidth / FULL_T_SPAN,
  };
}

/** Returns label fontSize for event bars, scaled to current LOD. */
export function eventLabelFontSize(zoomLevel: ZoomLevel): number {
  if (zoomLevel === 0) return 9;
  if (zoomLevel === 1) return 10;
  if (zoomLevel === 2) return 11;
  if (zoomLevel === 3) return 12;
  return 13; // level 4
}

/** Returns max number of label lines per bar at the current LOD. */
export function eventLabelMaxLines(zoomLevel: ZoomLevel): number {
  if (zoomLevel <= 2) return 1;
  if (zoomLevel === 3) return 2;
  return 3; // level 4
}

export const MIN_PIXELS_PER_UNIT = 1e-9;
export const MAX_PIXELS_PER_UNIT = 1000;

export function clampPixelsPerUnit(v: number): number {
  return Math.max(MIN_PIXELS_PER_UNIT, Math.min(MAX_PIXELS_PER_UNIT, v));
}

/**
 * Fraction of the viewport allowed to extend past "today" on the right.
 * Kept small (0.15) so "Heute" stays visually near the right edge even after
 * epoch-jump zooms that centre the viewport on the selected range.
 * The empty strip to the right carries no axis labels (see TimeAxis).
 */
export const PRESENT_RIGHT_PAD_FRACTION = 0.15;

/**
 * Clamps the pan offset so the viewport cannot scroll arbitrarily far past
 * "today". The right limit lets "Heute" reach the horizontal center of the
 * canvas (PRESENT_RIGHT_PAD_FRACTION = 0.5) so the present can be centered.
 * Guard against negative maxOffsetX (fully zoomed out) with Math.max(0, ...).
 */
export function clampOffsetX(offsetX: number, pixelsPerUnit: number, canvasWidth: number): number {
  'worklet';
  const viewportT = canvasWidth / pixelsPerUnit;
  const maxOffsetX = Math.max(0, T_MAX - viewportT * (1 - PRESENT_RIGHT_PAD_FRACTION));
  return Math.min(offsetX, maxOffsetX);
}
