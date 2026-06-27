import {
  assignTracks,
  computeLaneData,
  computeLineageConnectors,
  filterVisible,
  type VisibilityFilter,
} from '../culling';
import type { TimelineEvent } from '@/data/schema';
import type { Category } from '@/theme/tokens';

function ev(
  partial: Partial<TimelineEvent> & Pick<TimelineEvent, 'id' | 'startYear'>,
): TimelineEvent {
  return {
    title: partial.id,
    category: 'zivilisation',
    continent: 'europa',
    minZoomLevel: 0,
    ...partial,
  } as TimelineEvent;
}

const base: VisibilityFilter = {
  startYear: 0,
  endYear: 1000,
  zoomLevel: 4,
  categories: new Set<Category>(['erdzeitalter', 'natur', 'zivilisation', 'nation']),
  continent: 'europa',
};

describe('timeline/culling.filterVisible', () => {
  it('includes a range event that overlaps the viewport', () => {
    const e = ev({ id: 'a', startYear: -500, endYear: 500 });
    expect(filterVisible([e], base)).toEqual([e]);
  });

  it('excludes a range event entirely before the viewport', () => {
    const e = ev({ id: 'a', startYear: -500, endYear: -100 });
    expect(filterVisible([e], base)).toEqual([]);
  });

  it('excludes a range event entirely after the viewport', () => {
    const e = ev({ id: 'a', startYear: 1500, endYear: 2000 });
    expect(filterVisible([e], base)).toEqual([]);
  });

  it('inclusive boundary: event ending exactly at startYear is kept', () => {
    const e = ev({ id: 'a', startYear: -100, endYear: 0 });
    expect(filterVisible([e], base)).toEqual([e]);
  });

  it('inclusive boundary: event starting exactly at endYear is kept', () => {
    const e = ev({ id: 'a', startYear: 1000, endYear: 1100 });
    expect(filterVisible([e], base)).toEqual([e]);
  });

  it('treats a point event (no endYear) as a single year', () => {
    const inside = ev({ id: 'in', startYear: 500 });
    const outside = ev({ id: 'out', startYear: 1500 });
    expect(filterVisible([inside, outside], base)).toEqual([inside]);
  });

  it('filters out events whose category is disabled', () => {
    const e = ev({ id: 'a', startYear: 100, endYear: 200, category: 'natur' });
    const f = { ...base, categories: new Set<Category>(['zivilisation']) };
    expect(filterVisible([e], f)).toEqual([]);
  });

  it('keeps global events regardless of the selected continent', () => {
    const e = ev({ id: 'a', startYear: 100, endYear: 200, continent: 'global' });
    const f = { ...base, continent: 'asien' as const };
    expect(filterVisible([e], f)).toEqual([e]);
  });

  it('drops events whose continent does not match', () => {
    const e = ev({ id: 'a', startYear: 100, endYear: 200, continent: 'asien' });
    expect(filterVisible([e], base)).toEqual([]);
  });

  it('drops events whose minZoomLevel exceeds the current zoom band', () => {
    const e = ev({ id: 'a', startYear: 100, endYear: 200, minZoomLevel: 3 });
    const f = { ...base, zoomLevel: 1 as const };
    expect(filterVisible([e], f)).toEqual([]);
  });

  it('shows all importance tiers by default (no threshold)', () => {
    const core = ev({ id: 'core', startYear: 100, importance: 'core' });
    const detail = ev({ id: 'detail', startYear: 200, importance: 'detail' });
    expect(filterVisible([core, detail], base)).toEqual([core, detail]);
  });

  it('maxImportanceRank=core hides extended and detail tiers', () => {
    const core = ev({ id: 'core', startYear: 100, importance: 'core' });
    const extended = ev({ id: 'extended', startYear: 200, importance: 'extended' });
    const detail = ev({ id: 'detail', startYear: 300, importance: 'detail' });
    const f = { ...base, maxImportanceRank: 0 };
    expect(filterVisible([core, extended, detail], f)).toEqual([core]);
  });

  it('treats events without importance as the extended tier', () => {
    const undef = ev({ id: 'undef', startYear: 100 });
    // core threshold (rank 0) excludes the implicit extended (rank 1).
    expect(filterVisible([undef], { ...base, maxImportanceRank: 0 })).toEqual([]);
    // extended threshold (rank 1) includes it.
    expect(filterVisible([undef], { ...base, maxImportanceRank: 1 })).toEqual([undef]);
  });
});

describe('timeline/culling.assignTracks', () => {
  it('assigns non-overlapping events to the same track', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100 });
    const b = ev({ id: 'b', startYear: 200, endYear: 300 });
    const result = assignTracks([a, b]);
    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(0);
  });

  it('assigns overlapping events to different tracks', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 300 });
    const b = ev({ id: 'b', startYear: 100, endYear: 400 });
    const result = assignTracks([a, b]);
    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(1);
  });

  it('packs three events correctly: two overlap, third fits in track 0', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 200 });
    const b = ev({ id: 'b', startYear: 100, endYear: 400 });
    const c = ev({ id: 'c', startYear: 300, endYear: 500 });
    const result = assignTracks([a, b, c]);
    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(1);
    expect(result.get('c')).toBe(0); // c starts after a ends → reuses track 0
  });

  it('respects manual track override', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 200, track: 2 });
    const b = ev({ id: 'b', startYear: 50, endYear: 150 });
    const result = assignTracks([a, b]);
    expect(result.get('a')).toBe(2);
    expect(result.get('b')).toBe(0); // first available track
  });

  it('handles point events (no endYear): same year shares track (no overlap)', () => {
    // Two point events at the same year: endYear=startYear, so trackEndYears[0]=100 <= 100 → reuse track 0
    const a = ev({ id: 'a', startYear: 100 });
    const b = ev({ id: 'b', startYear: 100 });
    const result = assignTracks([a, b]);
    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(0);
  });

  it('handles point events (no endYear): consecutive years reuse track', () => {
    const a = ev({ id: 'a', startYear: 50 });
    const b = ev({ id: 'b', startYear: 200 });
    const result = assignTracks([a, b]);
    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(0);
  });

  it('assigns global events to lower tracks than regional events', () => {
    // Regional event starts earlier (would normally get track 0 by startYear sort),
    // but the global event should be prioritised to track 0.
    const regional = ev({ id: 'r1', startYear: -500, endYear: 500, continent: 'europa' });
    const global = ev({ id: 'g1', startYear: -300, endYear: 300, continent: 'global' });
    const result = assignTracks([regional, global]);
    expect(result.get('g1')).toBeLessThan(result.get('r1')!);
  });

  it('keeps non-overlapping lineage successors on the same track', () => {
    // A long-running other event would push a greedy successor to track 1,
    // but the shared lineage keeps the successor on track 0.
    const a = ev({ id: 'a', startYear: 0, endYear: 100, lineageId: 'L' });
    const other = ev({ id: 'other', startYear: 50, endYear: 400 }); // forces track 1
    const b = ev({ id: 'b', startYear: 150, endYear: 250, lineageId: 'L' });
    const result = assignTracks([a, other, b]);
    expect(result.get('a')).toBe(0);
    expect(result.get('other')).toBe(1);
    expect(result.get('b')).toBe(0); // follows its lineage, not the free track 1
  });
});

describe('timeline/culling.computeLineageConnectors', () => {
  it('connects consecutive same-lineage events on the same track', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100, lineageId: 'L' });
    const b = ev({ id: 'b', startYear: 150, endYear: 250, lineageId: 'L' });
    const tracks = assignTracks([a, b]);
    const connectors = computeLineageConnectors([a, b], tracks);
    expect(connectors).toEqual([{ lineageId: 'L', fromYear: 100, toYear: 150, track: 0 }]);
  });

  it('emits no connector when there is no gap (overlap/back-to-back)', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 150, lineageId: 'L' });
    const b = ev({ id: 'b', startYear: 150, endYear: 250, lineageId: 'L' });
    const tracks = assignTracks([a, b]);
    expect(computeLineageConnectors([a, b], tracks)).toEqual([]);
  });

  it('ignores events without a lineageId', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100 });
    const b = ev({ id: 'b', startYear: 200, endYear: 300 });
    const tracks = assignTracks([a, b]);
    expect(computeLineageConnectors([a, b], tracks)).toEqual([]);
  });

  it('skips events that have no rendered track (beyond the cap)', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100, lineageId: 'L' });
    const b = ev({ id: 'b', startYear: 150, endYear: 250, lineageId: 'L' });
    const tracks = assignTracks([a]); // b has no track entry
    expect(computeLineageConnectors([a, b], tracks)).toEqual([]);
  });
});

describe('timeline/culling.computeLaneData', () => {
  const lanes: Category[] = ['zivilisation', 'nation'];

  it('groups visible events per lane and assigns tracks', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100, category: 'zivilisation' });
    const b = ev({ id: 'b', startYear: 50, endYear: 150, category: 'zivilisation' }); // overlaps a
    const c = ev({ id: 'c', startYear: 200, endYear: 300, category: 'nation' });
    const result = computeLaneData({
      events: [a, b, c],
      startYear: 0,
      endYear: 1000,
      zoomLevel: 4,
      lanes,
      continent: 'europa',
      maxEventsPerLane: 15,
    });
    expect(result.visibleByLane.get('zivilisation')).toEqual([a, b]);
    expect(result.visibleByLane.get('nation')).toEqual([c]);
    // a and b overlap → different tracks.
    expect(result.tracksByLane.get('zivilisation')?.get('a')).toBe(0);
    expect(result.tracksByLane.get('zivilisation')?.get('b')).toBe(1);
    expect(result.overflowCounts.size).toBe(0);
  });

  it('caps tracks at maxEventsPerLane and records overflow', () => {
    // 3 non-overlapping events, cap at 2 → one overflow, only 2 get tracks.
    const events = [
      ev({ id: 'a', startYear: 0, endYear: 10 }),
      ev({ id: 'b', startYear: 100, endYear: 110 }),
      ev({ id: 'c', startYear: 200, endYear: 210 }),
    ];
    const result = computeLaneData({
      events,
      startYear: -100,
      endYear: 1000,
      zoomLevel: 4,
      lanes: ['zivilisation'],
      continent: 'europa',
      maxEventsPerLane: 2,
    });
    // visibleByLane stays uncapped (used for overflow accounting).
    expect(result.visibleByLane.get('zivilisation')).toHaveLength(3);
    expect(result.overflowCounts.get('zivilisation')).toBe(1);
    // Tracks only for the capped set.
    expect(result.tracksByLane.get('zivilisation')?.size).toBe(2);
  });

  it('only includes the requested lanes', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100, category: 'natur' });
    const result = computeLaneData({
      events: [a],
      startYear: -100,
      endYear: 1000,
      zoomLevel: 4,
      lanes: ['zivilisation'],
      continent: 'europa',
      maxEventsPerLane: 15,
    });
    expect(result.visibleByLane.has('natur')).toBe(false);
    expect(result.visibleByLane.get('zivilisation')).toEqual([]);
  });
});
