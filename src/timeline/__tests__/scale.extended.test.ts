import { yearToT, tToYear, viewportYearRange, yearToPixel, pixelToYear } from '../scale';

describe('viewportYearRange', () => {
  it('startYear < endYear for any valid viewport', () => {
    const { startYear, endYear } = viewportYearRange(1000, -2, 50);
    expect(startYear).toBeLessThan(endYear);
  });

  it('startYear equals year at pixel 0', () => {
    const offsetX = -1.5;
    const ppu = 100;
    const { startYear } = viewportYearRange(800, offsetX, ppu);
    expect(startYear).toBeCloseTo(pixelToYear(0, offsetX, ppu), 5);
  });

  it('endYear equals year at pixel width', () => {
    const offsetX = -1.5;
    const ppu = 100;
    const { endYear } = viewportYearRange(800, offsetX, ppu);
    expect(endYear).toBeCloseTo(pixelToYear(800, offsetX, ppu), 5);
  });

  it('wider viewport covers more years', () => {
    const opts = { offsetX: -2, ppu: 50 } as const;
    const narrow = viewportYearRange(400, opts.offsetX, opts.ppu);
    const wide = viewportYearRange(800, opts.offsetX, opts.ppu);
    expect(wide.endYear - wide.startYear).toBeGreaterThan(narrow.endYear - narrow.startYear);
  });
});

describe('yearToT edge cases', () => {
  it('year 0 maps to t=0', () => {
    expect(yearToT(0)).toBe(0);
  });

  it('positive and negative equidistant years have equal absolute t', () => {
    expect(Math.abs(yearToT(1000))).toBeCloseTo(Math.abs(yearToT(-1000)), 10);
  });

  it('is strictly monotonic', () => {
    const years = [
      -1_000_000_000, -1_000_000, -10_000, -100, 0, 100, 10_000, 1_000_000, 1_000_000_000,
    ];
    for (let i = 1; i < years.length; i++) {
      expect(yearToT(years[i]!)).toBeGreaterThan(yearToT(years[i - 1]!));
    }
  });
});

describe('tToYear edge cases', () => {
  it('t=0 maps back to year 0', () => {
    expect(tToYear(0)).toBeCloseTo(0, 10);
  });

  it('round-trips for extreme values', () => {
    for (const y of [-13_800_000_000, -4_500_000_000, -65_000_000, 1, 2026]) {
      expect(tToYear(yearToT(y))).toBeCloseTo(y, y === 0 ? 10 : -3);
    }
  });
});
