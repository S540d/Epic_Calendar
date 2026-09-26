import { ALL_EVENTS } from '@/data/events';
import { THEMES, childrenOf, eventMatchesTheme, themeById, topLevelThemes } from '../themes';

describe('themes (theme filter, #226)', () => {
  it('every theme has a unique id', () => {
    const ids = THEMES.map((th) => th.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every theme has an i18n key derived from its id', () => {
    for (const th of THEMES) {
      expect(th.labelKey).toBe(`theme.${th.id}.label`);
    }
  });

  it('every theme has a description i18n key derived from its id', () => {
    for (const th of THEMES) {
      expect(th.descriptionKey).toBe(`theme.${th.id}.description`);
    }
  });

  it('every theme declares at least one tag', () => {
    for (const th of THEMES) {
      expect(th.tagIds.length).toBeGreaterThan(0);
    }
  });

  it.each(THEMES.map((th) => [th.id, th] as const))(
    '%s matches at least 3 events',
    (_id, theme) => {
      // Continent diversity is deliberately not required: themes are about a
      // cross-cutting development (e.g. the history of medicine), not about
      // geographic spread — many science-history events are legitimately
      // tagged continent: 'global'.
      const matches = ALL_EVENTS.filter((ev) => eventMatchesTheme(ev, theme.id));
      expect(matches.length).toBeGreaterThanOrEqual(3);
    },
  );

  it('every parentId references an existing theme', () => {
    for (const th of THEMES) {
      if (th.parentId) expect(themeById(th.parentId)).toBeDefined();
    }
  });

  it("a parent theme matches a superset of each child's matches", () => {
    for (const parent of topLevelThemes()) {
      const children = childrenOf(parent.id);
      if (children.length === 0) continue;
      const parentMatches = new Set(
        ALL_EVENTS.filter((ev) => eventMatchesTheme(ev, parent.id)).map((ev) => ev.id),
      );
      for (const child of children) {
        const childMatches = ALL_EVENTS.filter((ev) => eventMatchesTheme(ev, child.id));
        for (const ev of childMatches) {
          expect(parentMatches.has(ev.id)).toBe(true);
        }
      }
    }
  });

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
