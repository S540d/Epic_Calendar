import { dominantEpoch } from '../epoch';
import type { TimelineEvent } from '@/data/schema';

const eras: TimelineEvent[] = [
  {
    id: 'phan',
    title: 'Phanerozoikum',
    startYear: -541_000_000,
    endYear: 0,
    category: 'erdzeitalter',
    continent: 'global',
    minZoomLevel: 0,
  },
  {
    id: 'meso',
    title: 'Mesozoikum',
    startYear: -252_000_000,
    endYear: -66_000_000,
    category: 'erdzeitalter',
    continent: 'global',
    minZoomLevel: 1,
  },
  {
    id: 'kaen',
    title: 'Känozoikum',
    startYear: -66_000_000,
    endYear: 0,
    category: 'erdzeitalter',
    continent: 'global',
    minZoomLevel: 1,
  },
  {
    id: 'holo',
    title: 'Holozän',
    startYear: -11_700,
    endYear: 2026,
    category: 'erdzeitalter',
    continent: 'global',
    minZoomLevel: 2,
  },
  // A non-era event must be ignored even if it contains the year.
  {
    id: 'rome',
    title: 'Rom',
    startYear: -753,
    endYear: 476,
    category: 'nation',
    continent: 'europa',
    minZoomLevel: 3,
  },
];

describe('dominantEpoch', () => {
  it('picks the most specific (smallest) era containing the year', () => {
    expect(dominantEpoch(-100_000_000, eras)?.title).toBe('Mesozoikum');
  });

  it('prefers a fine subdivision over its broad parent', () => {
    // -30M is inside both Phanerozoikum and Känozoikum; the smaller one wins.
    expect(dominantEpoch(-30_000_000, eras)?.title).toBe('Känozoikum');
  });

  it('returns the Holocene for recent years', () => {
    expect(dominantEpoch(0, eras)?.title).toBe('Holozän');
  });

  it('ignores non-era categories', () => {
    expect(dominantEpoch(100, eras)?.title).toBe('Holozän');
  });

  it('returns null when no era covers the year', () => {
    expect(dominantEpoch(-5_000_000_000, eras)).toBeNull();
  });
});
