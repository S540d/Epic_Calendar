import {
  NAVIGATION_EPOCHS,
  epochPathAt,
  epochPathForViewport,
  epochsAtDepth,
  epochsAtDepthCached,
  epochBandDepth,
  flattenEpochs,
  MIN_CRUMB_COVERAGE,
  type EpochDepth,
  type NavigationEpoch,
} from '../epoch';
import { PRESENT_YEAR } from '../scale';

const keys = (path: NavigationEpoch[]) => path.map((e) => e.key);

describe('epochPathAt', () => {
  it('returns the full ancestor chain down to the deepest match', () => {
    expect(keys(epochPathAt(-300))).toEqual(['humanHistory', 'antiquity', 'hellenism']);
  });

  it('stops at a leaf that has no children', () => {
    expect(keys(epochPathAt(-100_000_000))).toEqual(['mesozoic']);
  });

  it('assigns a shared boundary year to the later epoch', () => {
    // 600 ends lateAntiquity and starts earlyMiddleAges — the later one wins.
    expect(keys(epochPathAt(600))).toEqual(['humanHistory', 'middleAges', 'earlyMiddleAges']);
    expect(keys(epochPathAt(1500))).toEqual(['humanHistory', 'modern', 'earlyModern']);
  });

  it('still resolves the very end of the timeline', () => {
    expect(keys(epochPathAt(PRESENT_YEAR))).toEqual(['humanHistory', 'modern', 'contemporary']);
  });

  it('returns an empty path outside the tree', () => {
    expect(epochPathAt(-20_000_000_000)).toEqual([]);
    expect(epochPathAt(PRESENT_YEAR + 1000)).toEqual([]);
  });

  it('yields a monotonically nested chain', () => {
    for (const year of [-13_000_000_000, -500_000, -300, 800, 1900, 2000]) {
      const path = epochPathAt(year);
      for (let i = 1; i < path.length; i++) {
        const parent = path[i - 1]!;
        const child = path[i]!;
        expect(child.startYear).toBeGreaterThanOrEqual(parent.startYear);
        expect(child.endYear).toBeLessThanOrEqual(parent.endYear);
      }
    }
  });
});

describe('epochPathForViewport', () => {
  it('gives the full depth for a viewport sitting inside one sub-epoch', () => {
    expect(keys(epochPathForViewport(-320, -280))).toEqual([
      'humanHistory',
      'antiquity',
      'hellenism',
    ]);
  });

  it('collapses to a single crumb when fully zoomed out', () => {
    expect(epochPathForViewport(-13_800_000_000, PRESENT_YEAR).length).toBeLessThanOrEqual(1);
  });

  it('stops descending once a child covers too little of the span', () => {
    // Centre lands in antiquity, but antiquity is a sliver of the 5000-year span.
    const path = epochPathForViewport(-3000, PRESENT_YEAR);
    expect(keys(path)).toEqual(['humanHistory']);
  });

  it('never returns an empty path when the centre is inside the tree', () => {
    expect(epochPathForViewport(-1000, 1000).length).toBeGreaterThan(0);
  });

  it('keeps a crumb that covers exactly the coverage threshold', () => {
    // modern spans 1500..PRESENT_YEAR; a viewport twice that width puts it at ~50 %.
    const span = (PRESENT_YEAR - 1500) * 2;
    const path = epochPathForViewport(PRESENT_YEAR - span, PRESENT_YEAR);
    const coverage = (PRESENT_YEAR - 1500) / span;
    expect(coverage).toBeGreaterThanOrEqual(MIN_CRUMB_COVERAGE);
    expect(keys(path)).toContain('modern');
  });
});

describe('epochsAtDepth', () => {
  it('slices the tree into the expected number of segments', () => {
    expect(epochsAtDepth(0)).toHaveLength(6);
    expect(epochsAtDepth(1)).toHaveLength(10);
    expect(epochsAtDepth(2)).toHaveLength(16);
    expect(flattenEpochs()).toHaveLength(20);
  });

  it('returns the same arrays from the cached accessor', () => {
    for (const depth of [0, 1, 2] as EpochDepth[]) {
      expect(epochsAtDepthCached(depth)).toEqual(epochsAtDepth(depth));
    }
  });

  // The invariant that would have caught the -500 vs -800 divergence between the
  // old flat EPOCHS list and the navigation tree.
  it.each([0, 1, 2] as EpochDepth[])('covers the timeline without gaps at depth %i', (depth) => {
    const level = [...epochsAtDepth(depth)].sort((a, b) => a.startYear - b.startYear);
    for (let i = 1; i < level.length; i++) {
      expect(level[i]!.startYear).toBe(level[i - 1]!.endYear);
    }
  });

  it('spans an identical total range at every depth', () => {
    const spans = ([0, 1, 2] as EpochDepth[]).map((depth) => {
      const level = [...epochsAtDepth(depth)].sort((a, b) => a.startYear - b.startYear);
      return [level[0]!.startYear, level[level.length - 1]!.endYear];
    });
    expect(spans[1]).toEqual(spans[0]);
    expect(spans[2]).toEqual(spans[0]);
  });
});

describe('epochBandDepth', () => {
  it('coarsens for wide spans and refines for narrow ones', () => {
    expect(epochBandDepth(4_000_000_000)).toBe(0);
    expect(epochBandDepth(100_000)).toBe(1);
    expect(epochBandDepth(500)).toBe(2);
  });

  it('never refines as the visible span grows', () => {
    const spans = [100, 1_000, 3_000, 10_000, 1_000_000, 1_000_000_000];
    const depths = spans.map(epochBandDepth);
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeLessThanOrEqual(depths[i - 1]!);
    }
  });
});

describe('NAVIGATION_EPOCHS data integrity', () => {
  const all = flattenEpochs();

  it('gives every node a valid hex colour', () => {
    for (const epoch of all) {
      expect(epoch.color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('orders every range forwards in time', () => {
    for (const epoch of all) {
      expect(epoch.startYear).toBeLessThan(epoch.endYear);
    }
  });

  it('uses globally unique keys', () => {
    const seen = all.map((e) => e.key);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('has children that tile their parent exactly', () => {
    for (const epoch of all) {
      const children = epoch.children;
      if (!children?.length) continue;
      expect(children[0]!.startYear).toBe(epoch.startYear);
      expect(children[children.length - 1]!.endYear).toBe(epoch.endYear);
      for (let i = 1; i < children.length; i++) {
        expect(children[i]!.startYear).toBe(children[i - 1]!.endYear);
      }
    }
  });

  it('ends at the present', () => {
    const last = NAVIGATION_EPOCHS[NAVIGATION_EPOCHS.length - 1]!;
    expect(last.endYear).toBe(PRESENT_YEAR);
  });
});
