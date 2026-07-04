import { parseYearQuery, searchEvents } from '../search';
import type { TimelineEvent } from '@/data/schema';

function ev(
  partial: Partial<TimelineEvent> & Pick<TimelineEvent, 'id' | 'title' | 'startYear'>,
): TimelineEvent {
  return {
    category: 'zivilisation',
    continent: 'europa',
    minZoomLevel: 0,
    ...partial,
  } as TimelineEvent;
}

describe('searchEvents', () => {
  const events = [
    ev({ id: 'rom', title: 'Römisches Reich', startYear: -753, culture: 'römisch' }),
    ev({ id: 'romantik', title: 'Romantik', startYear: 1800 }),
    ev({ id: 'griechen', title: 'Antikes Griechenland', startYear: -800, culture: 'griechisch' }),
    ev({ id: 'tagged', title: 'Sonstiges Ereignis', startYear: 100, tags: ['römisch', 'handel'] }),
  ];

  it('returns empty for queries shorter than 2 characters', () => {
    expect(searchEvents(events, 'r')).toEqual([]);
    expect(searchEvents(events, '')).toEqual([]);
  });

  it('ranks exact title match first', () => {
    const results = searchEvents(events, 'Romantik');
    expect(results[0]?.event.id).toBe('romantik');
  });

  it('finds title-prefix matches before title-substring matches', () => {
    const results = searchEvents(events, 'rom');
    const ids = results.map((r) => r.event.id);
    // 'rom' and 'romantik' both start with "rom" → both rank above culture-only match on 'tagged'.
    expect(ids.indexOf('rom')).toBeLessThan(ids.indexOf('tagged'));
    expect(ids.indexOf('romantik')).toBeLessThan(ids.indexOf('tagged'));
  });

  it('matches on culture field', () => {
    const results = searchEvents(events, 'griechisch');
    expect(results.map((r) => r.event.id)).toContain('griechen');
  });

  it('matches on tags', () => {
    const results = searchEvents(events, 'handel');
    expect(results.map((r) => r.event.id)).toEqual(['tagged']);
  });

  it('is case-insensitive and diacritic-insensitive', () => {
    const events2 = [ev({ id: 'agypten', title: 'Ägyptisches Reich', startYear: -3000 })];
    expect(searchEvents(events2, 'AGYPT').map((r) => r.event.id)).toEqual(['agypten']);
    expect(searchEvents(events2, 'ägypt').map((r) => r.event.id)).toEqual(['agypten']);
  });

  it('returns no results when nothing matches', () => {
    expect(searchEvents(events, 'zzzznonexistent')).toEqual([]);
  });
});

describe('parseYearQuery', () => {
  it('parses a plain positive year as CE', () => {
    expect(parseYearQuery('1848')).toBe(1848);
  });

  it('parses a plain negative year', () => {
    expect(parseYearQuery('-500')).toBe(-500);
  });

  it('parses "500 v. Chr." as BCE', () => {
    expect(parseYearQuery('500 v. Chr.')).toBe(-500);
    expect(parseYearQuery('500 v.Chr.')).toBe(-500);
    expect(parseYearQuery('500 bce')).toBe(-500);
  });

  it('parses "3 Mio v. Chr." as scaled BCE', () => {
    expect(parseYearQuery('3 Mio v. Chr.')).toBe(-3_000_000);
  });

  it('parses a year with n. Chr. suffix as CE', () => {
    expect(parseYearQuery('1000 n. Chr.')).toBe(1000);
  });

  it('returns null for a non-numeric query', () => {
    expect(parseYearQuery('Römisches Reich')).toBeNull();
  });

  it('returns null for an empty query', () => {
    expect(parseYearQuery('')).toBeNull();
    expect(parseYearQuery('   ')).toBeNull();
  });
});
