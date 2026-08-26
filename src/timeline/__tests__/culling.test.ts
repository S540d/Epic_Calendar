import {
  assignTracks,
  buildStableTracksByLane,
  computeLaneData,
  computeLineageConnectors,
  filterVisible,
} from '../culling';
import { buildEventIndex } from '../eventIndex';
import type { Category } from '@/theme/tokens';
import { makeEvent as ev, baseVisibilityFilter as base } from './testUtils';

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

  it('clusters non-overlapping same-culture singletons onto one track (#146 B2)', () => {
    // Without culture affinity, greedy packing would put 'roman2' on track 0
    // too (it doesn't overlap 'roman1') — this test only proves the *intent*
    // holds when a distractor of a different culture is interleaved.
    const roman1 = ev({ id: 'roman1', startYear: 0, endYear: 100, culture: 'römisch' });
    const other = ev({ id: 'other', startYear: 50, endYear: 400, culture: 'keltisch' }); // forces roman2 off track 0 if greedy-only
    const roman2 = ev({ id: 'roman2', startYear: 150, endYear: 250, culture: 'römisch' });
    const result = assignTracks([roman1, other, roman2]);
    expect(result.get('roman1')).toBe(result.get('roman2'));
    expect(result.get('other')).not.toBe(result.get('roman1'));
  });

  it('opens a second same-culture row when the first has no room (overlap)', () => {
    const roman1 = ev({ id: 'roman1', startYear: 0, endYear: 500, culture: 'römisch' });
    // Overlaps roman1, so it cannot share its track despite the same culture.
    const roman2 = ev({ id: 'roman2', startYear: 100, endYear: 200, culture: 'römisch' });
    const result = assignTracks([roman1, roman2]);
    expect(result.get('roman1')).toBe(0);
    expect(result.get('roman2')).toBe(1);
  });

  it('never mixes different cultures into one row, even when there is free space', () => {
    // Regression for the jumbled-rows screenshot (#146): Tudor (englisch) must
    // NOT be packed into the free tail of the Byzantine row just because it fits.
    const byzanz = ev({ id: 'byzanz', startYear: 330, endYear: 1453, culture: 'byzantinisch' });
    const tudor = ev({ id: 'tudor', startYear: 1485, endYear: 1603, culture: 'englisch' });
    const aufklaerung = ev({ id: 'aufkl', startYear: 1685, endYear: 1815, culture: 'neuzeitlich' });
    const result = assignTracks([byzanz, tudor, aufklaerung]);
    const rows = new Set([result.get('byzanz'), result.get('tudor'), result.get('aufkl')]);
    expect(rows.size).toBe(3); // three cultures → three distinct rows
  });

  it('chains same-culture successors into one continuous row across distractors', () => {
    // England row: Plantagenet → Tudor, despite an overlapping French dynasty between them.
    const plantagenet = ev({ id: 'plant', startYear: 1154, endYear: 1399, culture: 'englisch' });
    const valois = ev({ id: 'valois', startYear: 1328, endYear: 1589, culture: 'französisch' });
    const tudor = ev({ id: 'tudor', startYear: 1485, endYear: 1603, culture: 'englisch' });
    const result = assignTracks([plantagenet, valois, tudor]);
    expect(result.get('plant')).toBe(result.get('tudor'));
    expect(result.get('valois')).not.toBe(result.get('plant'));
  });

  it('keeps culture-less events in neutral rows, never in culture-owned rows', () => {
    const rome = ev({ id: 'rome', startYear: 0, endYear: 100, culture: 'römisch' });
    const neutral = ev({ id: 'neutral', startYear: 200, endYear: 300 }); // fits after rome, but must not join its row
    const result = assignTracks([rome, neutral]);
    expect(result.get('neutral')).not.toBe(result.get('rome'));
  });

  it('shares one neutral row between non-overlapping culture-less events', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100 });
    const b = ev({ id: 'b', startYear: 200, endYear: 300 });
    const result = assignTracks([a, b]);
    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(0);
  });

  it('lineage groups take priority over culture affinity for the same events', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100, culture: 'fränkisch', lineageId: 'L' });
    const b = ev({ id: 'b', startYear: 150, endYear: 250, culture: 'fränkisch', lineageId: 'L' });
    const result = assignTracks([a, b]);
    expect(result.get('a')).toBe(result.get('b'));
  });

  it('places a same-culture singleton onto its lineage-culture row when free', () => {
    // A lineage row owned by "französisch" ends 1589; a French singleton starting later joins it.
    const a = ev({
      id: 'a',
      startYear: 987,
      endYear: 1328,
      culture: 'französisch',
      lineageId: 'F',
    });
    const b = ev({
      id: 'b',
      startYear: 1328,
      endYear: 1589,
      culture: 'französisch',
      lineageId: 'F',
    });
    const bourbon = ev({ id: 'bourbon', startYear: 1589, endYear: 1792, culture: 'französisch' });
    const result = assignTracks([a, b, bourbon]);
    expect(result.get('bourbon')).toBe(result.get('a'));
  });
});

describe('timeline/culling.assignTracks tier ordering (#70)', () => {
  it('places a later epoche band above an earlier reich (default) event', () => {
    // Regression for the jumbled hierarchy: the Byzantine Empire (a reich,
    // starting 330) must NOT sit above the Renaissance (an epoche band,
    // starting 1400). Tier is the primary row-ordering axis, above chronology.
    const byzanz = ev({ id: 'byzanz', startYear: 330, endYear: 1453, culture: 'byzantinisch' });
    const renaissance = ev({
      id: 'renaissance',
      startYear: 1400,
      endYear: 1600,
      culture: 'neuzeitlich',
      tier: 'epoche',
    });
    const result = assignTracks([byzanz, renaissance]);
    // Lower track number = higher in the lane. Epoche must win despite starting later.
    expect(result.get('renaissance')!).toBeLessThan(result.get('byzanz')!);
  });

  it('orders three tiers top-to-bottom: epoche < reich < dynastie', () => {
    const dynastie = ev({
      id: 'komnenen',
      startYear: 1081,
      endYear: 1185,
      culture: 'byzantinisch',
      tier: 'dynastie',
    });
    const reich = ev({ id: 'byzanz', startYear: 330, endYear: 1453, culture: 'byzantinisch2' });
    const epoche = ev({
      id: 'mittelalter',
      startYear: 500,
      endYear: 1500,
      culture: 'mittelalterlich',
      tier: 'epoche',
    });
    const result = assignTracks([dynastie, reich, epoche]);
    expect(result.get('mittelalter')!).toBeLessThan(result.get('byzanz')!);
    expect(result.get('byzanz')!).toBeLessThan(result.get('komnenen')!);
  });

  it('treats events without a tier as reich (default), below an epoche band', () => {
    const rome = ev({ id: 'rome', startYear: -27, endYear: 476, culture: 'römisch' }); // no tier
    const antike = ev({
      id: 'antike',
      startYear: -800,
      endYear: 500,
      culture: 'epochal',
      tier: 'epoche',
    });
    const result = assignTracks([rome, antike]);
    expect(result.get('antike')!).toBeLessThan(result.get('rome')!);
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

describe('timeline/culling.buildStableTracksByLane', () => {
  it('assigns tracks over the full category regardless of a year range', () => {
    const events = [
      ev({ id: 'a', startYear: -400_000_000, category: 'zivilisation' }),
      ev({ id: 'b', startYear: 2020, category: 'zivilisation' }),
    ];
    const index = buildEventIndex(events);
    const tracksByLane = buildStableTracksByLane(['zivilisation'], 'europa', undefined, index);
    const tracks = tracksByLane.get('zivilisation')!;
    expect(tracks.get('a')).toBe(0);
    expect(tracks.get('b')).toBe(0); // non-overlapping → same track is fine, no forced spread
  });
});

describe('timeline/culling.computeLaneData with stableTracksByLane (#146 B1)', () => {
  it('keeps an event on the same row when the viewport pans (no stableTracksByLane recompute)', () => {
    // Three non-overlapping events on the same category, spread over a wide range.
    const events = [
      ev({ id: 'a', startYear: 0, endYear: 10 }),
      ev({ id: 'b', startYear: 100, endYear: 110 }),
      ev({ id: 'c', startYear: 200, endYear: 210 }),
    ];
    const index = buildEventIndex(events);
    const stableTracksByLane = buildStableTracksByLane(
      ['zivilisation'],
      'europa',
      undefined,
      index,
    );

    // Viewport 1: only 'a' and 'b' visible.
    const view1 = computeLaneData({
      events,
      startYear: -50,
      endYear: 150,
      zoomLevel: 4,
      lanes: ['zivilisation'],
      continent: 'europa',
      maxEventsPerLane: 15,
      stableTracksByLane,
    });
    // Viewport 2: pan right, only 'b' and 'c' visible.
    const view2 = computeLaneData({
      events,
      startYear: 50,
      endYear: 250,
      zoomLevel: 4,
      lanes: ['zivilisation'],
      continent: 'europa',
      maxEventsPerLane: 15,
      stableTracksByLane,
    });

    // 'b' keeps the same row across both viewports even though the visible
    // set around it changed — this is the core guarantee of #146 B1.
    expect(view1.tracksByLane.get('zivilisation')?.get('b')).toBe(
      view2.tracksByLane.get('zivilisation')?.get('b'),
    );
  });

  it('assigns overlapping events to different, but viewport-stable, rows', () => {
    const a = ev({ id: 'a', startYear: 0, endYear: 100, category: 'zivilisation' });
    const b = ev({ id: 'b', startYear: 50, endYear: 150, category: 'zivilisation' }); // overlaps a
    const events = [a, b];
    const index = buildEventIndex(events);
    const stableTracksByLane = buildStableTracksByLane(
      ['zivilisation'],
      'europa',
      undefined,
      index,
    );

    const result = computeLaneData({
      events,
      startYear: 0,
      endYear: 1000,
      zoomLevel: 4,
      lanes: ['zivilisation'],
      continent: 'europa',
      maxEventsPerLane: 15,
      stableTracksByLane,
    });
    expect(result.tracksByLane.get('zivilisation')?.get('a')).toBe(0);
    expect(result.tracksByLane.get('zivilisation')?.get('b')).toBe(1);
  });

  it('compacts rows to a dense 0..k range for the events actually rendered in the viewport', () => {
    // Manual overrides force 'a' onto global row 0 and 'far' onto global row 5 —
    // a big gap that must not translate into 5 empty rendered rows when 'far'
    // is the only high-numbered event visible in this viewport.
    const a = ev({ id: 'a', startYear: 0, endYear: 10, category: 'zivilisation', track: 0 });
    const far = ev({ id: 'far', startYear: 500, endYear: 510, category: 'zivilisation', track: 5 });
    const events = [a, far];
    const index = buildEventIndex(events);
    const stableTracksByLane = buildStableTracksByLane(
      ['zivilisation'],
      'europa',
      undefined,
      index,
    );
    expect(stableTracksByLane.get('zivilisation')!.get('far')).toBe(5);

    const result = computeLaneData({
      events,
      startYear: -50,
      endYear: 1000,
      zoomLevel: 4,
      lanes: ['zivilisation'],
      continent: 'europa',
      maxEventsPerLane: 15,
      stableTracksByLane,
    });
    const tracks = result.tracksByLane.get('zivilisation')!;
    // Dense-remapped: only 2 distinct global rows are present → rendered as 0 and 1.
    expect(tracks.get('a')).toBe(0);
    expect(tracks.get('far')).toBe(1);
  });
});
