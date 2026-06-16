import { buildEventIndex } from '../eventIndex';
import { filterVisible, type VisibilityFilter } from '../culling';
import type { TimelineEvent } from '@/data/schema';
import type { Category } from '@/theme/tokens';
import { ALL_EVENTS } from '@/data/events';

function ev(
  partial: Partial<TimelineEvent> & Pick<TimelineEvent, 'id' | 'startYear'>,
): TimelineEvent {
  return {
    title: partial.id,
    category: 'zivilisation' as Category,
    continent: 'europa',
    minZoomLevel: 0,
    ...partial,
  } as TimelineEvent;
}

const baseFilter: VisibilityFilter = {
  startYear: 0,
  endYear: 1000,
  zoomLevel: 4,
  categories: new Set<Category>(['erdzeitalter', 'natur', 'zivilisation', 'nation']),
  continent: 'europa',
};

function sortedIds(events: TimelineEvent[]): string[] {
  return events.map((e) => e.id).sort();
}

describe('EventIndex.queryVisible matches filterVisible', () => {
  it('basic overlap case', () => {
    const events = [
      ev({ id: 'a', startYear: -500, endYear: 500 }),
      ev({ id: 'b', startYear: 200, endYear: 800 }),
      ev({ id: 'c', startYear: 2000, endYear: 3000 }),
    ];
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(baseFilter))).toEqual(
      sortedIds(filterVisible(events, baseFilter)),
    );
  });

  it('excludes events entirely before viewport', () => {
    const events = [ev({ id: 'early', startYear: -1000, endYear: -1 })];
    const index = buildEventIndex(events);
    expect(index.queryVisible(baseFilter)).toEqual([]);
  });

  it('excludes events entirely after viewport', () => {
    const events = [ev({ id: 'late', startYear: 1001, endYear: 2000 })];
    const index = buildEventIndex(events);
    expect(index.queryVisible(baseFilter)).toEqual([]);
  });

  it('inclusive boundary: event ending exactly at viewportStart', () => {
    const events = [ev({ id: 'a', startYear: -100, endYear: 0 })];
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(baseFilter))).toEqual(
      sortedIds(filterVisible(events, baseFilter)),
    );
  });

  it('inclusive boundary: event starting exactly at viewportEnd', () => {
    const events = [ev({ id: 'a', startYear: 1000, endYear: 2000 })];
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(baseFilter))).toEqual(
      sortedIds(filterVisible(events, baseFilter)),
    );
  });

  it('handles long aeon-spanning intervals correctly', () => {
    const events = [
      ev({
        id: 'aeon',
        startYear: -4_600_000_000,
        endYear: -4_000_000_000,
        category: 'erdzeitalter',
        continent: 'global',
        minZoomLevel: 0,
      }),
      ev({ id: 'recent', startYear: 100, endYear: 500 }),
    ];
    const f = { ...baseFilter, startYear: 0, endYear: 1000 };
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(f))).toEqual(sortedIds(filterVisible(events, f)));
  });

  it('respects continent filter', () => {
    const events = [
      ev({ id: 'eu', startYear: 100, continent: 'europa' }),
      ev({ id: 'as', startYear: 100, continent: 'asien' }),
      ev({ id: 'gl', startYear: 100, continent: 'global' }),
    ];
    const f = { ...baseFilter, continent: 'europa' as const };
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(f))).toEqual(sortedIds(filterVisible(events, f)));
  });

  it('respects zoomLevel filter', () => {
    const events = [
      ev({ id: 'low', startYear: 100, minZoomLevel: 0 }),
      ev({ id: 'high', startYear: 200, minZoomLevel: 3 }),
    ];
    const f = { ...baseFilter, zoomLevel: 1 as const };
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(f))).toEqual(sortedIds(filterVisible(events, f)));
  });

  it('respects category filter', () => {
    const events = [
      ev({ id: 'ziv', startYear: 100, category: 'zivilisation' }),
      ev({ id: 'nat', startYear: 200, category: 'natur' }),
    ];
    const f = { ...baseFilter, categories: new Set<Category>(['zivilisation']) };
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(f))).toEqual(sortedIds(filterVisible(events, f)));
  });

  it('handles point events (no endYear)', () => {
    const events = [
      ev({ id: 'inside', startYear: 500 }),
      ev({ id: 'outside', startYear: 5000 }),
    ];
    const index = buildEventIndex(events);
    expect(sortedIds(index.queryVisible(baseFilter))).toEqual(
      sortedIds(filterVisible(events, baseFilter)),
    );
  });

  const viewports: { startYear: number; endYear: number }[] = [
    { startYear: -400_000, endYear: 2026 },
    { startYear: -5000, endYear: 2026 },
    { startYear: -4_600_000_000, endYear: -1_000_000_000 },
    { startYear: 0, endYear: 2026 },
    { startYear: -100, endYear: 1800 },
  ];

  it.each(viewports)(
    'matches filterVisible on ALL_EVENTS: startYear=$startYear endYear=$endYear',
    ({ startYear, endYear }) => {
      const index = buildEventIndex(ALL_EVENTS);
      for (const zoomLevel of [0, 2, 4] as const) {
        for (const continent of ['europa', 'asien', 'global'] as const) {
          const f: VisibilityFilter = {
            startYear,
            endYear,
            zoomLevel,
            categories: new Set<Category>(['erdzeitalter', 'zivilisation', 'nation', 'natur']),
            continent,
          };
          expect(sortedIds(index.queryVisible(f))).toEqual(sortedIds(filterVisible(ALL_EVENTS, f)));
        }
      }
    },
  );
});

describe('EventIndex benchmark: 2000+ events', () => {
  it('queries 2000+ events in < 100ms for 100 iterations', () => {
    const events: TimelineEvent[] = [];
    for (let i = 0; i < 2000; i++) {
      events.push(
        ev({
          id: `synth-${i}`,
          startYear: -400_000 + i * 200,
          endYear: -400_000 + i * 200 + 100,
          category: i % 2 === 0 ? 'zivilisation' : 'nation',
          continent: 'europa',
          minZoomLevel: 0,
        }),
      );
    }
    const index = buildEventIndex(events);
    const query: VisibilityFilter = {
      startYear: -100_000,
      endYear: 100_000,
      zoomLevel: 2,
      categories: new Set<Category>(['zivilisation', 'nation']),
      continent: 'europa',
    };
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      index.queryVisible(query);
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
