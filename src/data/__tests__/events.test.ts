import { ALL_EVENTS } from '../events';
import type { TimelineEvent } from '../schema';
import type { Category } from '@/theme/tokens';

const VALID_CATEGORIES: Category[] = ['erdzeitalter', 'natur', 'zivilisation', 'nation', 'herrscher'];
const VALID_CONTINENTS = ['europa', 'asien', 'afrika', 'amerika', 'ozeanien', 'global'] as const;

describe('ALL_EVENTS data integrity', () => {
  it('has at least 200 events across all continents', () => {
    expect(ALL_EVENTS.length).toBeGreaterThanOrEqual(200);
  });

  it('every event has a unique id', () => {
    const ids = ALL_EVENTS.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every event has a valid category', () => {
    const invalid = ALL_EVENTS.filter((e) => !VALID_CATEGORIES.includes(e.category));
    expect(invalid).toHaveLength(0);
  });

  it('every event has a valid continent', () => {
    const invalid = ALL_EVENTS.filter(
      (e) => !VALID_CONTINENTS.includes(e.continent as (typeof VALID_CONTINENTS)[number]),
    );
    expect(invalid).toHaveLength(0);
  });

  it('every event has a startYear', () => {
    const missing = ALL_EVENTS.filter((e) => typeof e.startYear !== 'number');
    expect(missing).toHaveLength(0);
  });

  it('endYear is undefined or a number greater than startYear', () => {
    const invalid = ALL_EVENTS.filter(
      (e) => e.endYear !== undefined && e.endYear < e.startYear,
    );
    expect(invalid).toHaveLength(0);
  });

  it('minZoomLevel is between 0 and 4', () => {
    const invalid = ALL_EVENTS.filter(
      (e) => e.minZoomLevel < 0 || e.minZoomLevel > 4,
    );
    expect(invalid).toHaveLength(0);
  });

  it('all four enabled continents have events', () => {
    const enabled = ['europa', 'asien', 'afrika', 'amerika'] as const;
    for (const cont of enabled) {
      const count = ALL_EVENTS.filter((e) => e.continent === cont).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('each continent has at least 30 events', () => {
    const enabled = ['europa', 'asien', 'afrika', 'amerika'] as const;
    for (const cont of enabled) {
      const count = ALL_EVENTS.filter((e) => e.continent === cont).length;
      expect(count).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('continent-specific event counts', () => {
  const byCont = (c: string) => ALL_EVENTS.filter((e: TimelineEvent) => e.continent === c);

  it('Europa: ≥ 50 events', () => expect(byCont('europa').length).toBeGreaterThanOrEqual(50));
  it('Asien: ≥ 40 events', () => expect(byCont('asien').length).toBeGreaterThanOrEqual(40));
  it('Afrika: ≥ 35 events', () => expect(byCont('afrika').length).toBeGreaterThanOrEqual(35));
  it('Amerika: ≥ 35 events', () => expect(byCont('amerika').length).toBeGreaterThanOrEqual(35));
});
