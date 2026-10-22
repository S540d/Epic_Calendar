import { epochBandDepth, epochPathForViewport, epochsAtDepthCached } from './epoch';
import type { NavigationEpoch } from './epoch';
import { PRESENT_RIGHT_BUFFER_YEARS } from './lod';
import { PRESENT_YEAR, TIMELINE_START_YEAR } from './scale';

/**
 * How many viewports wide the context window of the minimap is (lower bound —
 * the window is rounded up to a "nice" span). Large enough that the viewport
 * box has surroundings to orient against, small enough that the box stays a
 * clearly visible, grabbable rectangle instead of a sliver.
 */
export const CONTEXT_ZOOM_RATIO = 8;

/** Outer bounds the context window is clamped to (same as the pannable range). */
export const CONTEXT_MIN_YEAR = TIMELINE_START_YEAR;
export const CONTEXT_MAX_YEAR = PRESENT_YEAR + PRESENT_RIGHT_BUFFER_YEARS;

export type ContextRange = {
  startYear: number;
  endYear: number;
  /** Epoch segments to paint inside the window (may extend past its edges). */
  segments: readonly NavigationEpoch[];
  /**
   * Epoch path of the *viewport* (not the window), e.g. [humanHistory,
   * middleAges] — the "where am I" crumbs shown on the strip.
   */
  path: NavigationEpoch[];
};

/** Smallest 1/2/5 × 10^n that is ≥ `x`. */
export function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(x));
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= x) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * Context window for the minimap ("overview + detail").
 *
 * Why not the full timeline: on the linear scale (#93) any historical viewport
 * is a vanishing fraction of 5 billion years, so the box degenerated into a
 * 4px stub at the right edge. Why not "the parent epoch": the tree is just as
 * lopsided — the Stone Age makes up 99.6 % of human history, so the Middle Ages
 * would again be a sliver inside it.
 *
 * Instead the window is ~{@link CONTEXT_ZOOM_RATIO}× the viewport, rounded to a
 * nice span and snapped to a grid of a quarter of that span. The snapping keeps
 * the window still while panning — the box moves inside it, and the window only
 * jumps once the viewport has travelled a quarter of its width — instead of a
 * background that slides along under a box frozen in the middle.
 */
export function contextRangeForViewport(viewStart: number, viewEnd: number): ContextRange {
  const viewSpan = Math.max(viewEnd - viewStart, 1);
  const fullSpan = CONTEXT_MAX_YEAR - CONTEXT_MIN_YEAR;
  const span = niceCeil(viewSpan * CONTEXT_ZOOM_RATIO);

  let startYear: number;
  let endYear: number;
  if (span >= fullSpan) {
    startYear = CONTEXT_MIN_YEAR;
    endYear = CONTEXT_MAX_YEAR;
  } else {
    // With viewSpan ≤ span/8 and the centre in the 3rd quarter-step, the whole
    // viewport always lies inside the window.
    const step = span / 4;
    const center = (viewStart + viewEnd) / 2;
    startYear = Math.floor(center / step) * step - 2 * step;
    if (startYear + span > CONTEXT_MAX_YEAR) startYear = CONTEXT_MAX_YEAR - span;
    if (startYear < CONTEXT_MIN_YEAR) startYear = CONTEXT_MIN_YEAR;
    endYear = startYear + span;
  }

  return {
    startYear,
    endYear,
    segments: epochsAtDepthCached(epochBandDepth(endYear - startYear)),
    path: epochPathForViewport(viewStart, viewEnd),
  };
}
