import type { Category } from '@/theme/tokens';

export type Continent =
  | 'europa'
  | 'asien'
  | 'afrika'
  | 'amerika'
  | 'ozeanien'
  | 'global';

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
};

