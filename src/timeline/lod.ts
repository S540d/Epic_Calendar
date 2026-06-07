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
const T_MIN = yearToT(-13_800_000_000);
const T_MAX = yearToT(2026);
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

export const MIN_PIXELS_PER_UNIT = 12;
export const MAX_PIXELS_PER_UNIT = 8000;

export function clampPixelsPerUnit(v: number): number {
  return Math.max(MIN_PIXELS_PER_UNIT, Math.min(MAX_PIXELS_PER_UNIT, v));
}

/**
 * Clamps the pan offset so the viewport cannot scroll past "today" on the
 * right or past the Big Bang on the left.
 *
 * maxOffsetX: today sits exactly at the right edge of the canvas.
 * minOffsetX: Big Bang sits at the left edge (optional hard stop).
 */
export function clampOffsetX(offsetX: number, pixelsPerUnit: number, canvasWidth: number): number {
  'worklet';
  const maxOffsetX = T_MAX - canvasWidth / pixelsPerUnit;
  return Math.min(offsetX, maxOffsetX);
}
