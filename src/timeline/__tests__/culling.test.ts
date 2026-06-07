import { assignTracks, filterVisible, type VisibilityFilter } from '../culling';
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
});
