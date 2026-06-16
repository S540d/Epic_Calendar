import { validateEvent, type TimelineEvent, VALID_IMPORTANCE_LEVELS } from '../schema';
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

  // Phase 1.2 – new optional schema slots
  it('accepts valid new optional fields', () => {
    const event: TimelineEvent = {
      ...valid,
      importance: 'core',
      tags: ['religion', 'krieg'],
      lineageId: 'frankenreich',
      regions: ['westeuropa', 'mitteleuropa'],
    };
    expect(validateEvent(event, CATEGORIES)).toEqual([]);
  });

  it('accepts events without the new optional fields (backwards compat)', () => {
    expect(validateEvent(valid, CATEGORIES)).toEqual([]);
  });

  it('covers all VALID_IMPORTANCE_LEVELS without error', () => {
    for (const level of VALID_IMPORTANCE_LEVELS) {
      expect(validateEvent({ ...valid, importance: level }, CATEGORIES)).toEqual([]);
    }
  });

  it('flags an invalid importance value', () => {
    const errs = validateEvent({ ...valid, importance: 'legendary' as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('importance'))).toBe(true);
  });

  it('flags tags that is not an array', () => {
    const errs = validateEvent({ ...valid, tags: 'single' as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('tags'))).toBe(true);
  });

  it('flags tags containing non-string elements', () => {
    const errs = validateEvent({ ...valid, tags: [42] as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('tags'))).toBe(true);
  });

  it('flags lineageId that is not a string', () => {
    const errs = validateEvent({ ...valid, lineageId: 123 as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('lineageId'))).toBe(true);
  });

  it('flags regions that is not an array', () => {
    const errs = validateEvent({ ...valid, regions: 'europa' as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('regions'))).toBe(true);
  });

  it('flags regions containing non-string elements', () => {
    const errs = validateEvent({ ...valid, regions: [true] as never }, CATEGORIES);
    expect(errs.some((e) => e.includes('regions'))).toBe(true);
  });
});
