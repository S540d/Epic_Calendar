import { ALL_EVENTS } from '@/data/events';
import {
  LEARNING_JOURNEYS,
  journeyById,
  resolveJourneySteps,
  type LearningJourney,
} from '../learningJourneys';

const EVENTS_BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]));

describe('learning journeys (Lernreise)', () => {
  it('every journey has a unique id', () => {
    const ids = LEARNING_JOURNEYS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every journey has an icon and i18n keys derived from its id', () => {
    for (const j of LEARNING_JOURNEYS) {
      expect(j.icon.length).toBeGreaterThan(0);
      expect(j.labelKey).toBe(`learning.journey.${j.id}.label`);
      expect(j.descriptionKey).toBe(`learning.journey.${j.id}.description`);
    }
  });

  // The whole point of a curated journey is that every station actually exists.
  it.each(LEARNING_JOURNEYS.map((j) => [j.id, j] as const))(
    '%s references only existing event ids',
    (_id, journey: LearningJourney) => {
      const missing = journey.eventIds.filter((id) => !EVENTS_BY_ID.has(id));
      expect(missing).toEqual([]);
    },
  );

  it.each(LEARNING_JOURNEYS.map((j) => [j.id, j] as const))(
    '%s has no duplicate stations',
    (_id, journey: LearningJourney) => {
      expect(new Set(journey.eventIds).size).toBe(journey.eventIds.length);
    },
  );

  it.each(LEARNING_JOURNEYS.map((j) => [j.id, j] as const))(
    '%s runs chronologically forward',
    (_id, journey: LearningJourney) => {
      const years = resolveJourneySteps(journey, ALL_EVENTS).map((e) => e.startYear);
      const sorted = [...years].sort((a, b) => a - b);
      expect(years).toEqual(sorted);
    },
  );

  it.each(LEARNING_JOURNEYS.map((j) => [j.id, j] as const))(
    '%s is long enough to be a journey but short enough to finish',
    (_id, journey: LearningJourney) => {
      expect(journey.eventIds.length).toBeGreaterThanOrEqual(5);
      expect(journey.eventIds.length).toBeLessThanOrEqual(25);
    },
  );

  it('every station of the "berühmte Geschichten" journey actually carries a story', () => {
    const journey = journeyById('beruehmte-geschichten');
    expect(journey).toBeDefined();
    const withoutStory = resolveJourneySteps(journey!, ALL_EVENTS)
      .filter((e) => !e.story)
      .map((e) => e.id);
    expect(withoutStory).toEqual([]);
  });

  it('journeyById resolves known ids and returns undefined for unknown ones', () => {
    expect(journeyById('grosse-reise')?.id).toBe('grosse-reise');
    expect(journeyById('gibt-es-nicht')).toBeUndefined();
  });

  it('resolveJourneySteps preserves journey order, not chronological input order', () => {
    const journey: LearningJourney = {
      id: 'test',
      labelKey: 'learning.journey.test.label',
      descriptionKey: 'learning.journey.test.description',
      icon: '🧪',
      eventIds: ['b', 'a'],
    };
    const events = [
      { id: 'a', startYear: 1 },
      { id: 'b', startYear: 2 },
    ] as never;
    expect(resolveJourneySteps(journey, events).map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('resolveJourneySteps skips unknown ids instead of throwing', () => {
    const journey: LearningJourney = {
      id: 'test',
      labelKey: 'learning.journey.test.label',
      descriptionKey: 'learning.journey.test.description',
      icon: '🧪',
      eventIds: ['a', 'gibt-es-nicht', 'b'],
    };
    const events = [
      { id: 'a', startYear: 1 },
      { id: 'b', startYear: 2 },
    ] as never;
    expect(resolveJourneySteps(journey, events).map((e) => e.id)).toEqual(['a', 'b']);
  });
});
