import europa from './europa.json';
import erdzeitalter from './erdzeitalter.json';
import type { TimelineEvent } from '@/data/schema';

export const ALL_EVENTS: TimelineEvent[] = [
  ...(erdzeitalter as TimelineEvent[]),
  ...(europa as TimelineEvent[]),
];
