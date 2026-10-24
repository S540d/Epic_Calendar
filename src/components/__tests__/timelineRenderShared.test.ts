import { computeLabelVisibleIds, LABEL_MIN_TEXT_PX } from '../timelineRenderShared';
import { makeEvent } from '@/timeline/__tests__/testUtils';
import type { TimelineEvent } from '@/data/schema';
import type { Category } from '@/theme/tokens';

/** 1 px per year, viewport starts at year 0, 400px wide. */
function labelled(events: TimelineEvent[]): Set<string> {
  const cat = 'zivilisation' as Category;
  const tracks = new Map(events.map((ev, i) => [ev.id, i]));
  return computeLabelVisibleIds(new Map([[cat, events]]), new Map([[cat, tracks]]), 0, 1, 400);
}

describe('computeLabelVisibleIds (#284)', () => {
  it('hides labels on bars too narrow for readable text', () => {
    const narrow = makeEvent({ id: 'narrow', startYear: 100, endYear: 130 });
    expect(labelled([narrow]).has('narrow')).toBe(false);
  });

  it('labels bars with at least LABEL_MIN_TEXT_PX of text room', () => {
    const wide = makeEvent({ id: 'wide', startYear: 100, endYear: 100 + LABEL_MIN_TEXT_PX + 6 });
    expect(labelled([wide]).has('wide')).toBe(true);
  });

  it('still labels point events via their virtual slot', () => {
    const point = makeEvent({ id: 'point', startYear: 100 });
    expect(labelled([point]).has('point')).toBe(true);
  });

  it('hides the label of a bar whose visible part is clipped at the canvas edge', () => {
    const clipped = makeEvent({ id: 'clipped', startYear: 380, endYear: 600 });
    expect(labelled([clipped]).has('clipped')).toBe(false);
  });
});
