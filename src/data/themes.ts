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
];

const BY_ID = new Map<string, Theme>(THEMES.map((th) => [th.id, th]));

/** Look up a theme by id. */
export function themeById(id: string): Theme | undefined {
  return BY_ID.get(id);
}

/** True if `event` carries at least one of the theme's tags. */
export function eventMatchesTheme(event: Pick<TimelineEvent, 'tags'>, themeId: string): boolean {
  const theme = BY_ID.get(themeId);
  if (!theme || !event.tags) return false;
  return event.tags.some((tag) => theme.tagIds.includes(tag));
}
