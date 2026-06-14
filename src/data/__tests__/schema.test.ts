import { validateEvent, type TimelineEvent } from '../schema';
import type { Category } from '@/theme/tokens';

const CATEGORIES: Category[] = ['erdzeitalter', 'natur', 'zivilisation', 'nation', 'herrscher'];

const valid: TimelineEvent = {
  id: 'e1',
  title: 'Test',
  startYear: -100,
  endYear: 50,
  category: 'zivilisation',
  continent: 'europa',
  minZoomLevel: 2,
};

describe('validateEvent', () => {
  it('accepts a well-formed event', () => {
    expect(validateEvent(valid, CATEGORIES)).toEqual([]);
  });

  it('accepts a point event without endYear', () => {
    const { endYear, ...point } = valid;
    expect(validateEvent(point, CATEGORIES)).toEqual([]);
  });

  it('flags a missing minZoomLevel', () => {
    const { minZoomLevel, ...rest } = valid;
    const errs = validateEvent(rest, CATEGORIES);
    expect(errs.some((e) => e.includes('minZoomLevel'))).toBe(true);
  });

  it('flags an out-of-range minZoomLevel', () => {
    const errs = validateEvent({ ...valid, minZoomLevel: 7 as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('minZoomLevel'))).toBe(true);
  });

  it('flags an unknown category', () => {
    const errs = validateEvent({ ...valid, category: 'bogus' as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('category'))).toBe(true);
  });

  it('flags an unknown continent', () => {
    const errs = validateEvent({ ...valid, continent: 'atlantis' as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('continent'))).toBe(true);
  });

  it('flags endYear before startYear', () => {
    const errs = validateEvent({ ...valid, startYear: 100, endYear: 50 }, CATEGORIES);
    expect(errs.some((e) => e.includes('endYear'))).toBe(true);
  });

  it('flags a missing id and title', () => {
    const errs = validateEvent({ ...valid, id: '', title: '' }, CATEGORIES);
    expect(errs.some((e) => e.includes('id'))).toBe(true);
    expect(errs.some((e) => e.includes('title'))).toBe(true);
  });
});
