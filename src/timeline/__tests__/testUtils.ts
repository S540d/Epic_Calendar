import type { VisibilityFilter } from '../culling';
import type { TimelineEvent } from '@/data/schema';
import type { Category } from '@/theme/tokens';

/** Builds a minimal TimelineEvent for tests; `title` defaults to `id` unless overridden. */
export function makeEvent(
  partial: Partial<TimelineEvent> & Pick<TimelineEvent, 'id' | 'startYear'>,
): TimelineEvent {
  return {
    title: partial.id,
    category: 'zivilisation',
    continent: 'europa',
    minZoomLevel: 0,
    ...partial,
  } as TimelineEvent;
}

export const baseVisibilityFilter: VisibilityFilter = {
  startYear: 0,
  endYear: 1000,
  zoomLevel: 4,
  categories: new Set<Category>(['erdzeitalter', 'natur', 'zivilisation', 'nation']),
  continent: 'europa',
};
