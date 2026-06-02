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

export const CATEGORY_LABELS: Record<Category, string> = {
  erdzeitalter: 'Erdzeitalter',
  natur: 'Natur',
  zivilisation: 'Zivilisationen',
  nation: 'Reiche',
  herrscher: 'Herrscher',
};

export const CONTINENT_LABELS: Record<Continent, string> = {
  europa: 'Europa',
  asien: 'Asien',
  afrika: 'Afrika',
  amerika: 'Amerika',
  ozeanien: 'Ozeanien',
  global: 'Global',
};
