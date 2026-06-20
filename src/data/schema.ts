import type { Category } from '@/theme/tokens';

export type Continent = 'europa' | 'asien' | 'afrika' | 'amerika' | 'ozeanien' | 'global';

export type ZoomLevel = 0 | 1 | 2 | 3 | 4;

export type TimelineEvent = {
  id: string;
  title: string;
  description?: string;
  /** Negative numbers = BCE. E.g. -753 for Roman foundation. */
  startYear: number;
  /** Undefined = point event. */
  endYear?: number;
  category: Category;
  continent: Continent;
  /**
   * Formal sub-category within a category, e.g. "römisch", "Phanerozoikum".
   * Acts as the primary sub-classification axis; values are free-form strings
   * that will be constrained via config in a later phase.
   */
  culture?: string;
  /**
   * Relevance tier for progressive disclosure (e.g. Kids Mode).
   * core     = always show (major milestones)
   * extended = default detail level
   * detail   = deepest zoom / specialist view
   */
  importance?: 'core' | 'extended' | 'detail';
  /** Free-form keyword tags for cross-cutting search/filter. */
  tags?: string[];
  /**
   * Links this event to a named lineage (e.g. "frankenreich").
   * Events sharing a lineageId can be rendered in the same track
   * and connected by a continuation line.
   */
  lineageId?: string;
  /**
   * Flexible region memberships beyond the top-level continent.
   * References region IDs from src/data/regions.ts (Phase 1.4).
   * An event may belong to multiple regions simultaneously.
   */
  regions?: string[];
  /**
   * Lowest zoom band at which this event becomes visible.
   * 0 = always visible (eons); 4 = only deepest zoom.
   */
  minZoomLevel: ZoomLevel;
  color?: string;
  iconKey?: string;
  /** Manual track override within a lane (0-indexed). If absent, computed by assignTracks(). */
  track?: number;
};

export type ImportanceLevel = 'core' | 'extended' | 'detail';

export const VALID_IMPORTANCE_LEVELS: readonly ImportanceLevel[] = ['core', 'extended', 'detail'];

/**
 * Numeric rank per importance tier — lower = more essential. Used by the
 * detail-level filter as a cumulative threshold: a tier shows itself plus all
 * lower-ranked tiers.
 */
export const IMPORTANCE_RANK: Record<ImportanceLevel, number> = {
  core: 0,
  extended: 1,
  detail: 2,
};

/**
 * Rank of an event's importance. Events without an explicit `importance` are
 * treated as `extended` (the default detail tier).
 */
export function importanceRank(event: Pick<TimelineEvent, 'importance'>): number {
  return event.importance ? IMPORTANCE_RANK[event.importance] : IMPORTANCE_RANK.extended;
}

/** True if the event is visible at the given maximum importance rank threshold. */
export function passesImportance(
  event: Pick<TimelineEvent, 'importance'>,
  maxRank: number,
): boolean {
  return importanceRank(event) <= maxRank;
}

export const VALID_CONTINENTS: readonly Continent[] = [
  'europa',
  'asien',
  'afrika',
  'amerika',
  'ozeanien',
  'global',
];

export const VALID_ZOOM_LEVELS: readonly ZoomLevel[] = [0, 1, 2, 3, 4];

/**
 * Runtime validator for a single timeline event. Returns a list of problems
 * (empty == valid). Used by data-integrity tests to guard the JSON sources;
 * `validCategories` is passed in to avoid a circular import on tokens.
 */
export function validateEvent(
  event: Partial<TimelineEvent>,
  validCategories: readonly Category[],
): string[] {
  const errors: string[] = [];
  if (typeof event.id !== 'string' || event.id.length === 0) errors.push('missing/invalid id');
  if (typeof event.title !== 'string' || event.title.length === 0)
    errors.push('missing/invalid title');
  if (typeof event.startYear !== 'number' || Number.isNaN(event.startYear))
    errors.push('missing/invalid startYear');
  if (
    event.endYear !== undefined &&
    (typeof event.endYear !== 'number' || event.endYear < (event.startYear ?? -Infinity))
  )
    errors.push('endYear must be a number ≥ startYear');
  if (!validCategories.includes(event.category as Category))
    errors.push(`invalid category: ${String(event.category)}`);
  if (!VALID_CONTINENTS.includes(event.continent as Continent))
    errors.push(`invalid continent: ${String(event.continent)}`);
  if (!VALID_ZOOM_LEVELS.includes(event.minZoomLevel as ZoomLevel))
    errors.push(`missing/invalid minZoomLevel: ${String(event.minZoomLevel)}`);
  if (
    event.importance !== undefined &&
    !VALID_IMPORTANCE_LEVELS.includes(event.importance as ImportanceLevel)
  )
    errors.push(`invalid importance: ${String(event.importance)}`);
  if (event.tags !== undefined && !Array.isArray(event.tags)) errors.push('tags must be an array');
  if (
    event.tags !== undefined &&
    Array.isArray(event.tags) &&
    event.tags.some((t) => typeof t !== 'string')
  )
    errors.push('tags must be an array of strings');
  if (event.lineageId !== undefined && typeof event.lineageId !== 'string')
    errors.push('lineageId must be a string');
  if (event.regions !== undefined && !Array.isArray(event.regions))
    errors.push('regions must be an array');
  if (
    event.regions !== undefined &&
    Array.isArray(event.regions) &&
    event.regions.some((r) => typeof r !== 'string')
  )
    errors.push('regions must be an array of strings');
  return errors;
}
