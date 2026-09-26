import type { TimelineEvent } from './schema';

/**
 * Curated, cross-continent theme vocabulary for the theme filter (#226).
 *
 * Deliberately a *controlled* vocabulary (not free text): each theme maps to
 * one or more existing `TimelineEvent.tags` values that already cut across
 * continents/categories (e.g. "kolonialismus" already spans afrika, amerika,
 * asien, europa, ozeanien). This reuses existing, already-tagged content
 * instead of inventing a second, parallel tagging axis — no new fields on
 * `TimelineEvent`, no content-migration risk.
 *
 * Distinct from `LearningJourney` (#171, `learningJourneys.ts`): a journey is
 * a strictly ordered, guided walk through a hand-picked station list with its
 * own UI (bottom bar, step navigation). A theme is a filter — it narrows the
 * free-roaming zoom/pan timeline down to matching events, in place, without
 * imposing an order.
 */
export type Theme = {
  /** Stable id, also the i18n key suffix (`theme.<id>.label`). */
  id: string;
  /** i18n key for the theme's display name. */
  labelKey: string;
  /**
   * Underlying `TimelineEvent.tags` values this theme matches. An event
   * qualifies if it carries at least one of these tags.
   */
  tagIds: readonly string[];
  /**
   * Id of the parent theme, if this is a sub-theme (e.g. "mathematik" under
   * "aufklaerung"). Absent = top-level theme. `THEMES` stays a flat list —
   * the hierarchy is expressed purely through this reference so existing
   * flat iteration (tests, `THEMES.map`) keeps working; `topLevelThemes()`/
   * `childrenOf()` below build the tree view for the UI.
   */
  parentId?: string;
};

export const THEMES: readonly Theme[] = [
  {
    id: 'voelkerwanderungen',
    labelKey: 'theme.voelkerwanderungen.label',
    tagIds: ['migration', 'besiedlung'],
  },
  {
    id: 'kolonialismus',
    labelKey: 'theme.kolonialismus.label',
    tagIds: ['kolonialismus'],
  },
  {
    id: 'seefahrt',
    labelKey: 'theme.seefahrt.label',
    tagIds: ['seefahrt', 'entdeckung'],
  },
  {
    id: 'demokratie',
    labelKey: 'theme.demokratie.label',
    tagIds: ['demokratie'],
  },
  {
    id: 'aufklaerung',
    labelKey: 'theme.aufklaerung.label',
    tagIds: ['aufklärung'],
  },
  {
    id: 'kalter-krieg',
    labelKey: 'theme.kalter-krieg.label',
    tagIds: ['kalter-krieg'],
  },
  // Sub-themes of "Aufklärung & Wissenschaft" — first batch of a growing set
  // (further science-history sub-themes are expected). Each reuses tags
  // already carried by natur-wissenschaft.json events; no new content needed.
  {
    id: 'mathematik',
    labelKey: 'theme.mathematik.label',
    parentId: 'aufklaerung',
    tagIds: ['mathematik'],
  },
  {
    id: 'medizin',
    labelKey: 'theme.medizin.label',
    parentId: 'aufklaerung',
    tagIds: ['medizin'],
  },
  {
    id: 'physik',
    labelKey: 'theme.physik.label',
    parentId: 'aufklaerung',
    tagIds: ['physik', 'astronomie'],
  },
  {
    id: 'technologie',
    labelKey: 'theme.technologie.label',
    parentId: 'aufklaerung',
    tagIds: ['technologie'],
  },
  {
    id: 'pandemien',
    labelKey: 'theme.pandemien.label',
    parentId: 'aufklaerung',
    tagIds: ['pandemie'],
  },
  {
    id: 'klima',
    labelKey: 'theme.klima.label',
    parentId: 'aufklaerung',
    tagIds: ['klima'],
  },
];

const BY_ID = new Map<string, Theme>(THEMES.map((th) => [th.id, th]));

/** Look up a theme by id. */
export function themeById(id: string): Theme | undefined {
  return BY_ID.get(id);
}

/** Themes without a parent — the top level shown as cards on `ThemesScreen`. */
export function topLevelThemes(): Theme[] {
  return THEMES.filter((th) => !th.parentId);
}

/** Direct children of a theme, in declaration order. */
export function childrenOf(parentId: string): Theme[] {
  return THEMES.filter((th) => th.parentId === parentId);
}

/**
 * A theme's own `tagIds` plus, recursively, every descendant's `tagIds`.
 * Selecting a parent theme therefore matches everything its children would
 * match too, without having to keep the parent's tag list manually in sync.
 */
export function descendantTagIds(themeId: string): string[] {
  const theme = BY_ID.get(themeId);
  if (!theme) return [];
  const tags = new Set<string>(theme.tagIds);
  for (const child of childrenOf(themeId)) {
    for (const tag of descendantTagIds(child.id)) tags.add(tag);
  }
  return Array.from(tags);
}

/** True if `event` carries at least one tag of the theme or of its descendants. */
export function eventMatchesTheme(event: Pick<TimelineEvent, 'tags'>, themeId: string): boolean {
  if (!BY_ID.has(themeId) || !event.tags) return false;
  const tags = descendantTagIds(themeId);
  return event.tags.some((tag) => tags.includes(tag));
}
