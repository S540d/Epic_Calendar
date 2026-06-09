import {
  clampPixelsPerUnit,
  eventLabelMaxLines,
  MAX_PIXELS_PER_UNIT,
  MIN_PIXELS_PER_UNIT,
  pixelsPerUnitToZoomLevel,
  humanHistoryViewState,
  defaultViewState,
  HUMAN_T_SPAN,
  FULL_T_SPAN,
} from '../lod';

describe('timeline/lod', () => {
  describe('pixelsPerUnitToZoomLevel band boundaries', () => {
    // Bands: < 12 → 0, < 30 → 1, < 100 → 2, < 500 → 3, else → 4
    const cases: Array<[number, 0 | 1 | 2 | 3 | 4]> = [
      [0, 0],
      [11.999, 0],
      [12, 1],
      [29.999, 1],
      [30, 2],
      [99.999, 2],
      [100, 3],
      [499.999, 3],
      [500, 4],
      [10_000, 4],
    ];
    it.each(cases)('ppu=%s → zoomLevel=%s', (ppu, expected) => {
      expect(pixelsPerUnitToZoomLevel(ppu)).toBe(expected);
    });
  });

  describe('clampPixelsPerUnit', () => {
    it('clamps below MIN', () => {
      expect(clampPixelsPerUnit(0)).toBe(MIN_PIXELS_PER_UNIT);
      expect(clampPixelsPerUnit(-100)).toBe(MIN_PIXELS_PER_UNIT);
    });
    it('clamps above MAX', () => {
      expect(clampPixelsPerUnit(MAX_PIXELS_PER_UNIT + 1)).toBe(MAX_PIXELS_PER_UNIT);
      expect(clampPixelsPerUnit(1e9)).toBe(MAX_PIXELS_PER_UNIT);
    });
    it('returns value unchanged when within range', () => {
      expect(clampPixelsPerUnit(MIN_PIXELS_PER_UNIT)).toBe(MIN_PIXELS_PER_UNIT);
      expect(clampPixelsPerUnit(MAX_PIXELS_PER_UNIT)).toBe(MAX_PIXELS_PER_UNIT);
      expect(clampPixelsPerUnit(1234)).toBe(1234);
    });
  });
});

describe('humanHistoryViewState', () => {
  it('falls back to ppu=30 for zero-width canvas', () => {
    const { pixelsPerUnit } = humanHistoryViewState(0);
    expect(pixelsPerUnit).toBe(30);
  });

  it('fills a 1000px canvas exactly with the human-history t-span', () => {
    const width = 1000;
    const { pixelsPerUnit } = humanHistoryViewState(width);
    expect(pixelsPerUnit * HUMAN_T_SPAN).toBeCloseTo(width, 5);
  });

  it('ppu scales linearly with canvas width', () => {
    const { pixelsPerUnit: p1 } = humanHistoryViewState(400);
    const { pixelsPerUnit: p2 } = humanHistoryViewState(800);
    expect(p2).toBeCloseTo(p1 * 2, 5);
  });
});

describe('eventLabelMaxLines', () => {
  it('returns 1 for zoom levels 0–2', () => {
    expect(eventLabelMaxLines(0)).toBe(1);
    expect(eventLabelMaxLines(1)).toBe(1);
    expect(eventLabelMaxLines(2)).toBe(1);
  });
  it('returns 2 for zoom level 3', () => {
    expect(eventLabelMaxLines(3)).toBe(2);
  });
  it('returns 3 for zoom level 4', () => {
    expect(eventLabelMaxLines(4)).toBe(3);
  });
});

describe('defaultViewState', () => {
  it('falls back to MIN_PIXELS_PER_UNIT for zero-width canvas', () => {
    const { pixelsPerUnit } = defaultViewState(0);
    expect(pixelsPerUnit).toBe(MIN_PIXELS_PER_UNIT);
  });

  it('fills canvas with the full t-span', () => {
    const width = 800;
    const { pixelsPerUnit } = defaultViewState(width);
    expect(pixelsPerUnit * FULL_T_SPAN).toBeCloseTo(width, 5);
  });
});
