import { layoutJourneyStrip } from '../journeyStrip';
import { makeEvent } from './testUtils';

const at = (...years: number[]) => years.map((y, i) => makeEvent({ id: `e${i}`, startYear: y }));

describe('layoutJourneyStrip', () => {
  it('returns null for no stations', () => {
    expect(layoutJourneyStrip([])).toBeNull();
  });

  it('derives the span from the stations and places them strictly linearly', () => {
    const l = layoutJourneyStrip(at(0, 100, 1000))!;
    expect(l.startYear).toBe(0);
    expect(l.endYear).toBe(1000);
    expect(l.positions).toEqual([0, 0.1, 1]);
  });

  it('uses endYear of the latest-ending station for the right edge', () => {
    const evs = [
      makeEvent({ id: 'a', startYear: 0 }),
      makeEvent({ id: 'b', startYear: 10, endYear: 100 }),
    ];
    expect(layoutJourneyStrip(evs)!.endYear).toBe(100);
  });

  it('centres markers when all stations share one year', () => {
    expect(layoutJourneyStrip(at(5, 5))!.positions).toEqual([0.5, 0.5]);
  });
});
