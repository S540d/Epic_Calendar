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
  /** Subgroup within a category, e.g. "römisch", "Phanerozoikum". */
  culture?: string;
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
  return errors;
}
