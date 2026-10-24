import { generateTicks } from '../TimeAxis';

const t = (key: string) => key;

/** Rendered label centres: centred on the tick, clamped into the canvas (label width 90px). */
function labelCentres(ticks: { px: number }[], width: number): number[] {
  return ticks.map((tk) => Math.min(Math.max(tk.px, 45), width - 45));
}

describe('TimeAxis generateTicks', () => {
  it('shows more than the anchor label on a narrow phone canvas', () => {
    // ~245px canvas spanning ~95 Mio years, as on an iPhone in the Palaeozoic.
    const canvasWidth = 245;
    const ticks = generateTicks(-602_800_000, canvasWidth / 95_000_000, canvasWidth, t);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });

  it.each([200, 245, 320, 800, 1400])('keeps labels ≥ 90px apart at width %ipx', (width) => {
    for (const span of [37, 950, 12_000, 3_300_000, 95_000_000, 4_000_000_000]) {
      const ticks = generateTicks(-span - 500, width / span, width, t);
      const centres = labelCentres(ticks, width);
      for (let i = 1; i < centres.length; i++) {
        expect(centres[i]! - centres[i - 1]!).toBeGreaterThanOrEqual(90);
      }
      expect(ticks.length).toBeLessThanOrEqual(10);
    }
  });

  it('keeps the desktop step unchanged (Middle Ages on 800px)', () => {
    const ticks = generateTicks(600, 800 / 900, 800, t);
    // 100 years would be 89px apart → 200-year steps, as before.
    expect(ticks.map((tk) => tk.year)).toEqual([600, 800, 1000, 1200, 1400]);
  });
});
