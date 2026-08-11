#!/usr/bin/env node
/**
 * Dev-only content-coverage report: prints how many events exist per
 * category × continent and per category × importance level, so gaps in
 * the event data are visible without opening the app. Run via `npm run
 * coverage`. Reads the JSON files directly (no build/TS step needed).
 */
const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', 'src', 'data', 'events');

// Known ordering, kept in sync with src/theme/categories.ts / src/data/schema.ts.
// Any value found in the data but not listed here is appended automatically,
// so the script never silently hides a new category/continent.
const CATEGORY_ORDER = ['erdzeitalter', 'zivilisation', 'herrscher', 'nation', 'natur', 'kultur'];
const CONTINENT_ORDER = ['europa', 'asien', 'afrika', 'amerika', 'ozeanien', 'global'];
const IMPORTANCE_ORDER = ['core', 'extended', 'detail'];

function loadEvents() {
  const files = fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.json'));
  const events = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8');
    events.push(...JSON.parse(raw));
  }
  return events;
}

/** Appends any values seen in the data but missing from `known`, so new
 *  categories/continents show up instead of being silently dropped. */
function withDiscovered(known, values) {
  const extra = [...new Set(values)].filter((v) => !known.includes(v)).sort();
  return [...known, ...extra];
}

function printTable(title, rowLabels, colLabels, cellFn) {
  console.log(`\n${title}`);
  const rowHeaderWidth = Math.max(8, ...rowLabels.map((r) => r.length));
  const colWidths = colLabels.map((c) => Math.max(c.length, 5));

  const pad = (s, w) => String(s).padStart(w, ' ');
  const padLeft = (s, w) => String(s).padEnd(w, ' ');

  let header = padLeft('', rowHeaderWidth) + '  ';
  header += colLabels.map((c, i) => pad(c, colWidths[i])).join('  ');
  header += '  ' + pad('total', 5);
  console.log(header);
  console.log('-'.repeat(header.length));

  const colTotals = colLabels.map(() => 0);
  let grandTotal = 0;

  for (const row of rowLabels) {
    let rowTotal = 0;
    const cells = colLabels.map((col, i) => {
      const n = cellFn(row, col);
      rowTotal += n;
      colTotals[i] += n;
      return n === 0 ? pad('·', colWidths[i]) : pad(n, colWidths[i]);
    });
    grandTotal += rowTotal;
    console.log(padLeft(row, rowHeaderWidth) + '  ' + cells.join('  ') + '  ' + pad(rowTotal, 5));
  }

  console.log('-'.repeat(header.length));
  console.log(
    padLeft('total', rowHeaderWidth) +
      '  ' +
      colTotals.map((n, i) => pad(n, colWidths[i])).join('  ') +
      '  ' +
      pad(grandTotal, 5),
  );
}

function main() {
  const events = loadEvents();
  const categories = withDiscovered(
    CATEGORY_ORDER,
    events.map((e) => e.category),
  );
  const continents = withDiscovered(
    CONTINENT_ORDER,
    events.map((e) => e.continent),
  );

  const byCatContinent = new Map();
  const byCatImportance = new Map();
  for (const e of events) {
    const ccKey = `${e.category}|${e.continent}`;
    byCatContinent.set(ccKey, (byCatContinent.get(ccKey) ?? 0) + 1);
    const importance = e.importance ?? 'extended';
    const ciKey = `${e.category}|${importance}`;
    byCatImportance.set(ciKey, (byCatImportance.get(ciKey) ?? 0) + 1);
  }

  console.log(`Epic Calendar content coverage — ${events.length} events total\n`);
  console.log('"·" marks an empty category × continent / importance combination (a content gap).');

  printTable(
    'Events per category × continent',
    categories,
    continents,
    (cat, cont) => byCatContinent.get(`${cat}|${cont}`) ?? 0,
  );

  printTable(
    'Events per category × detail level (importance)',
    categories,
    IMPORTANCE_ORDER,
    (cat, imp) => byCatImportance.get(`${cat}|${imp}`) ?? 0,
  );

  console.log('');
}

main();
