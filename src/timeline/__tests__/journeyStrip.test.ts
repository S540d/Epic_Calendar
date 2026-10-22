import { layoutJourneyStrip } from '../journeyStrip';
import { makeEvent } from './testUtils';

const at = (...years: number[]) => years.map((y, i) => makeEvent({ id: `e${i}`, startYear: y }));

describe('layoutJourneyStrip', () => {
  it('returns null for no stations', () => {
    expect(layoutJourneyStrip([])).toBeNull();
  });

  it('derives the span from the stations and places them linearly', () => {
    const l = layoutJourneyStrip(at(0, 500, 1000), 0.01)!;
    expect(l.startYear).toBe(0);
    expect(l.endYear).toBe(1000);
    expect(l.positions).toEqual([0, 0.5, 1]);
  });

  it('uses endYear of the latest-ending station for the right edge', () => {
    const evs = [
      makeEvent({ id: 'a', startYear: 0 }),
      makeEvent({ id: 'b', startYear: 10, endYear: 100 }),
    ];
    expect(layoutJourneyStrip(evs, 0.01)!.endYear).toBe(100);
  });

  it('pushes clustered stations apart but keeps order and bounds', () => {
    const { positions } = layoutJourneyStrip(at(0, 1, 2, 1000), 0.1)!;
    for (let i = 1; i < positions.length; i++) {
      expect((positions[i] ?? 0) - (positions[i - 1] ?? 0)).toBeGreaterThanOrEqual(0.1 - 1e-9);
    }
    expect(Math.min(...positions)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...positions)).toBeLessThanOrEqual(1);
  });

  it('keeps bounds when the cluster sits at the right edge', () => {
    const { positions } = layoutJourneyStrip(at(0, 998, 999, 1000), 0.1)!;
    expect(positions[3]).toBe(1);
    expect(positions[2]).toBeCloseTo(0.9);
  });

  it('falls back to equal spacing when there is no room, or all years are equal', () => {
    expect(layoutJourneyStrip(at(0, 1, 2), 0.6)!.positions).toEqual([0, 0.5, 1]);
    expect(layoutJourneyStrip(at(5, 5, 5))!.positions).toEqual([0, 0.5, 1]);
  });
});
