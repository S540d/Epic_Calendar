import { ALL_EVENTS } from '@/data/events';
import { buildEventIndex } from './eventIndex';

/**
 * Single shared `EventIndex` over the static event set, built once at module
 * load. Used by both `TimelineView` (viewport queries) and `TimelineScreen`
 * (e.g. deriving the culture list for the #163 country/culture filter) so
 * there's exactly one O(n) index build instead of one per consumer.
 */
export const globalEventIndex = buildEventIndex(ALL_EVENTS);
