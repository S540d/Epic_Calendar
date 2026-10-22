import {
  CONTEXT_MAX_YEAR,
  CONTEXT_MIN_YEAR,
  CONTEXT_ZOOM_RATIO,
  contextRangeForViewport,
  niceCeil,
} from '../contextRange';

describe('niceCeil', () => {
  it('rounds up to 1/2/5 × 10^n', () => {
    expect(niceCeil(7200)).toBe(10_000);
    expect(niceCeil(320)).toBe(500);
    expect(niceCeil(150)).toBe(200);
    expect(niceCeil(1000)).toBe(1000);
    expect(niceCeil(0)).toBe(1);
  });
});

describe('contextRangeForViewport', () => {
  it('Middle Ages: the window is a few viewports wide, not the whole timeline', () => {
    const r = contextRangeForViewport(600, 1500);
    const span = r.endYear - r.startYear;
    expect(span).toBeGreaterThanOrEqual(900 * CONTEXT_ZOOM_RATIO);
    expect(span).toBeLessThan(900 * CONTEXT_ZOOM_RATIO * 2.5);
    expect(r.startYear).toBeLessThanOrEqual(600);
    expect(r.endYear).toBeGreaterThanOrEqual(1500);
    // Clamped to the right edge (present + buffer).
    expect(r.endYear).toBeLessThanOrEqual(CONTEXT_MAX_YEAR);
    const keys = r.segments.map((s) => s.key);
    expect(keys).toEqual(expect.arrayContaining(['antiquity', 'middleAges', 'modern']));
    expect(r.path.map((p) => p.key)).toEqual(['humanHistory', 'middleAges']);
  });

  it('always contains the viewport, wherever it lies on the snap grid', () => {
    for (let start = -3000; start < 1000; start += 37) {
      const r = contextRangeForViewport(start, start + 100);
      expect(r.startYear).toBeLessThanOrEqual(start);
      expect(r.endYear).toBeGreaterThanOrEqual(start + 100);
    }
  });

  it('stays put while panning within a snap step', () => {
    const a = contextRangeForViewport(-310, -290);
    const b = contextRangeForViewport(-305, -285);
    expect(b.startYear).toBe(a.startYear);
    expect(b.endYear).toBe(a.endYear);
  });

  it('falls back to the full timeline when zoomed far out', () => {
    const r = contextRangeForViewport(-4_000_000_000, 0);
    expect(r.startYear).toBe(CONTEXT_MIN_YEAR);
    expect(r.endYear).toBe(CONTEXT_MAX_YEAR);
    expect(r.segments.map((s) => s.key)).toContain('humanHistory');
  });

  it('clamps at the present without losing the viewport', () => {
    const r = contextRangeForViewport(1990, 2026);
    expect(r.endYear).toBe(CONTEXT_MAX_YEAR);
    expect(r.startYear).toBeLessThanOrEqual(1990);
  });
});
