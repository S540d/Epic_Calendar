import type { ZoomLevel } from '@/data/schema';
import { yearToT } from './scale';

/**
 * LOD bands (pixels per t-unit → discrete level).
 * Calibrated so the default "human history" view (-400 000 → today, ppu ≈ 33–40)
 * falls in band 2 "Epochen", showing both geological spans and major civilisations.
 *
 * Band boundaries: < 12 → 0, < 30 → 1, < 100 → 2, < 500 → 3, else → 4
 */
export function pixelsPerUnitToZoomLevel(pixelsPerUnit: number): ZoomLevel {
  if (pixelsPerUnit < 12) return 0;
  if (pixelsPerUnit < 30) return 1;
  if (pixelsPerUnit < 100) return 2;
  if (pixelsPerUnit < 500) return 3;
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
const T_NOW = yearToT(2026);
export const HUMAN_T_SPAN = T_NOW - T_HUMAN_START;

// Full timeline: Big Bang (−13.8 Gyr) to present.
export const T_MIN = yearToT(-13_800_000_000);
export const T_MAX = yearToT(2026);
export const FULL_T_SPAN = T_MAX - T_MIN;

/**
 * Default view: human prehistory (−400 000 years) to today.
 * "Heute" lands exactly at the right edge of the canvas.
 */
export function humanHistoryViewState(canvasWidth: number): {
  offsetX: number;
  pixelsPerUnit: number;
} {
  if (canvasWidth <= 0) return { offsetX: T_HUMAN_START, pixelsPerUnit: 30 };
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
  if (zoomLevel <= 1) return 0;
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

export const MIN_PIXELS_PER_UNIT = 12;
export const MAX_PIXELS_PER_UNIT = 8000;

export function clampPixelsPerUnit(v: number): number {
  return Math.max(MIN_PIXELS_PER_UNIT, Math.min(MAX_PIXELS_PER_UNIT, v));
}

/**
 * Fraction of the viewport allowed to extend past "today" on the right, so the
 * user can pan/zoom far enough to *center* the present (the interesting, recent
 * part of history) instead of it being stuck against the right edge. The empty
 * space to the right of "Heute" carries no axis labels (see TimeAxis).
 */
export const PRESENT_RIGHT_PAD_FRACTION = 0.5;

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
