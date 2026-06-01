import { yearToT, tToYear, pixelToYear, yearToPixel } from '../scale';

describe('timeline/scale', () => {
  it('yearToT is monotonic across the full range', () => {
    const ys = [-13_800_000_000, -1_000_000, -1, 0, 1, 1_000_000, 2026];
    let prev = -Infinity;
    for (const y of ys) {
      const t = yearToT(y);
      expect(t).toBeGreaterThan(prev);
      prev = t;
    }
  });

  it('yearToT and tToYear are approximate inverses', () => {
    for (const y of [-13_800_000_000, -753, 0, 1492, 2026]) {
      const round = tToYear(yearToT(y));
      expect(Math.abs(round - y) / Math.max(1, Math.abs(y))).toBeLessThan(1e-6);
    }
  });

  it('pixelToYear inverts yearToPixel', () => {
    const offsetX = -1.5;
    const ppu = 200;
    for (const y of [-1000, 0, 1000, 2026]) {
      const px = yearToPixel(y, offsetX, ppu);
      const back = pixelToYear(px, offsetX, ppu);
      expect(Math.abs(back - y) / Math.max(1, Math.abs(y))).toBeLessThan(1e-6);
    }
  });
});
