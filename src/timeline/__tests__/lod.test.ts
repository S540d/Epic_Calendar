import {
  clampPixelsPerUnit,
  MAX_PIXELS_PER_UNIT,
  MIN_PIXELS_PER_UNIT,
  pixelsPerUnitToZoomLevel,
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
