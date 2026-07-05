import type { TimelineEvent } from '@/data/schema';

export type SearchResult = {
  event: TimelineEvent;
  /** Lower is a better match (0 = exact title match). Used for ordering only. */
  score: number;
};

/** Strips diacritics and lowercases so "Ägypten"/"aegypten" both match "agypten". */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Searches events by title, culture and tags. Substring match is sufficient
 * at this data volume (500+ events) — no fuzzy-matching library needed.
 * Query must be at least 2 characters (avoids noisy single-letter results).
 */
export function searchEvents(events: TimelineEvent[], query: string): SearchResult[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];

  const results: SearchResult[] = [];
  for (const event of events) {
    const title = normalize(event.title);
    const culture = event.culture ? normalize(event.culture) : '';
    const tags = event.tags?.map(normalize) ?? [];

    let score: number | null = null;
    if (title === q) score = 0;
    else if (title.startsWith(q)) score = 1;
    else if (title.includes(q)) score = 2;
    else if (culture.startsWith(q) || culture.includes(q)) score = 3;
    else if (tags.some((tag) => tag.startsWith(q) || tag.includes(q))) score = 4;

    if (score !== null) results.push({ event, score });
  }

  results.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.event.startYear - b.event.startYear;
  });
  return results;
}

/** Matches a bare year query like "500", "-500", "500 v. Chr.", "3 Mio". Returns null if not a year query. */
export function parseYearQuery(query: string): number | null {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return null;

  const bceMatch = q.match(/^(-?\d+(?:[.,]\d+)?)\s*(mio\.?|million)?\s*(v\.?\s*chr\.?|bce)$/);
  if (bceMatch) {
    const n = parseFloat(bceMatch[1]!.replace(',', '.'));
    const scale = bceMatch[2] ? 1_000_000 : 1;
    return -Math.abs(n) * scale;
  }

  const ceMatch = q.match(/^(-?\d+(?:[.,]\d+)?)\s*(mio\.?|million)?\s*(n\.?\s*chr\.?|ce)?$/);
  if (ceMatch) {
    const n = parseFloat(ceMatch[1]!.replace(',', '.'));
    const scale = ceMatch[2] ? 1_000_000 : 1;
    return n * scale;
  }

  return null;
}
