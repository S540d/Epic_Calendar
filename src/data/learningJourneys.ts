import type { TimelineEvent } from './schema';

/**
 * A curated, ordered walk through a handful of existing events — the "Lernreise"
 * (learning journey) that powers the guided kids mode.
 *
 * A journey is deliberately just an ordered list of **existing** event ids, not
 * its own content: the station text comes from the event's `title` /
 * `description` / `story` / `mnemonic`, so a journey never duplicates content
 * that already lives in the event JSON and can't drift out of sync with it.
 * Curation is the whole value here — which ~15 of the 600+ events tell a
 * coherent story, and in which order.
 */
export type LearningJourney = {
  /** Stable id, also the persistence key for this journey's progress. */
  id: string;
  /** i18n key for the journey name. */
  labelKey: string;
  /** i18n key for the one-line description shown on the landing page. */
  descriptionKey: string;
  /** Emoji shown on the journey card. */
  icon: string;
  /**
   * Ordered event ids — the journey's narrative sequence. Normally
   * chronological; `learningJourneys.test.ts` enforces that every id resolves
   * to a real event and that the order is non-decreasing by start year.
   */
  eventIds: readonly string[];
};

export const LEARNING_JOURNEYS: readonly LearningJourney[] = [
  {
    id: 'grosse-reise',
    labelKey: 'learning.journey.grosse-reise.label',
    descriptionKey: 'learning.journey.grosse-reise.description',
    icon: '🌌',
    eventIds: [
      'geo-urknall',
      'geo-hadaikum',
      'geo-mesozoikum',
      'chicxulub-impact',
      'frueh-homo-sapiens',
      'frueh-out-of-africa',
      'frueh-neolithikum',
      'af-pyramiden-gizeh',
      'eu-griechen-klassik',
      'eu-roem-kaiserzeit',
      'eu-westrom-untergang',
      'gutenberg-buchdruck',
      'am-kolumbus',
      'eu-industrialisierung',
      'eu-zweiter-weltkrieg',
      'apollo-11-moon-landing',
      'world-wide-web',
    ],
  },
  {
    id: 'beruehmte-geschichten',
    labelKey: 'learning.journey.beruehmte-geschichten.label',
    descriptionKey: 'learning.journey.beruehmte-geschichten.description',
    icon: '📖',
    // Every station here carries a `story` — this journey is the guided tour
    // through the anecdotes (#171 follow-up).
    eventIds: [
      'as-buddha',
      'eu-herr-diogenes',
      'eu-herr-alexander',
      'archimedes-tod',
      'af-kleopatra-vii',
      'eu-caesar-ermordung',
      'as-dschingis-khan',
      'galileo-inquisition',
      'newton-principia',
      'franklin-blitzableiter',
      'curie-radioaktivitaet',
    ],
  },
  {
    id: 'erfindungen',
    labelKey: 'learning.journey.erfindungen.label',
    descriptionKey: 'learning.journey.erfindungen.description',
    icon: '💡',
    eventIds: [
      'rad-erfindung',
      'papier-erfindung',
      'schiesspulver-erfindung',
      'kompass-erfindung',
      'gutenberg-buchdruck',
      'stephenson-lokomotive',
      'bell-telefon',
      'edison-gluehbirne',
      'wright-motorflug',
      'fleming-penicillin',
      'eniac-computer',
      'transistor-bell-labs',
      'world-wide-web',
    ],
  },
];

const BY_ID = new Map<string, LearningJourney>(LEARNING_JOURNEYS.map((j) => [j.id, j]));

/** Look up a journey by id. */
export function journeyById(id: string): LearningJourney | undefined {
  return BY_ID.get(id);
}

/**
 * Resolves a journey's event ids against the event set, preserving journey
 * order. Unknown ids are skipped rather than throwing — a typo in the curated
 * list should cost one station, not crash the screen (the test suite is what
 * catches typos).
 */
export function resolveJourneySteps(
  journey: LearningJourney,
  events: readonly TimelineEvent[],
): TimelineEvent[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const steps: TimelineEvent[] = [];
  for (const id of journey.eventIds) {
    const event = byId.get(id);
    if (event) steps.push(event);
  }
  return steps;
}
