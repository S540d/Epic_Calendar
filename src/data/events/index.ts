import europa from './europa.json';
import erdzeitalter from './erdzeitalter.json';
import asien from './asien.json';
import afrika from './afrika.json';
import amerika from './amerika.json';
import type { TimelineEvent } from '@/data/schema';

export const ALL_EVENTS: TimelineEvent[] = [
  ...(erdzeitalter as TimelineEvent[]),
  ...(europa as TimelineEvent[]),
  ...(asien as TimelineEvent[]),
  ...(afrika as TimelineEvent[]),
  ...(amerika as TimelineEvent[]),
];
