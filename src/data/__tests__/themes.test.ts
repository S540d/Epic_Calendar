import { ALL_EVENTS } from '@/data/events';
import { THEMES, eventMatchesTheme, themeById } from '../themes';

describe('themes (theme filter, #226)', () => {
  it('every theme has a unique id', () => {
    const ids = THEMES.map((th) => th.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every theme has an icon and an i18n key derived from its id', () => {
    for (const th of THEMES) {
      expect(th.icon.length).toBeGreaterThan(0);
      expect(th.labelKey).toBe(`theme.${th.id}.label`);
    }
  });

  it('every theme declares at least one tag', () => {
    for (const th of THEMES) {
      expect(th.tagIds.length).toBeGreaterThan(0);
    }
  });

  it.each(THEMES.map((th) => [th.id, th] as const))(
    '%s matches at least 3 events across at least 2 continents',
    (_id, theme) => {
      const matches = ALL_EVENTS.filter((ev) => eventMatchesTheme(ev, theme.id));
      expect(matches.length).toBeGreaterThanOrEqual(3);
      const continents = new Set(matches.map((ev) => ev.continent));
      expect(continents.size).toBeGreaterThanOrEqual(2);
    },
  );

  it('themeById resolves known ids and returns undefined for unknown ones', () => {
    expect(themeById('kolonialismus')?.id).toBe('kolonialismus');
    expect(themeById('gibt-es-nicht')).toBeUndefined();
  });

  it('eventMatchesTheme matches an event carrying one of the theme tags', () => {
    expect(eventMatchesTheme({ tags: ['kolonialismus', 'handel'] }, 'kolonialismus')).toBe(true);
  });

  it('eventMatchesTheme is false for events without a matching tag', () => {
    expect(eventMatchesTheme({ tags: ['handel'] }, 'kolonialismus')).toBe(false);
    expect(eventMatchesTheme({}, 'kolonialismus')).toBe(false);
  });

  it('eventMatchesTheme returns false for an unknown theme id', () => {
    expect(eventMatchesTheme({ tags: ['kolonialismus'] }, 'gibt-es-nicht')).toBe(false);
  });
});
