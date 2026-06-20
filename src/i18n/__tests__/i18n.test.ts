import de from '../de.json';
import en from '../en.json';

type Json = Record<string, unknown>;

/** Flattens a nested object into dot-separated key paths. */
function flatten(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v) ? flatten(v as Json, path) : [path];
  });
}

const deKeys = flatten(de as Json).sort();
const enKeys = flatten(en as Json).sort();

describe('i18n resources', () => {
  it('de and en expose the exact same key set', () => {
    expect(deKeys).toEqual(enKeys);
  });

  it('has no empty translation values', () => {
    for (const [lang, data] of [
      ['de', de],
      ['en', en],
    ] as const) {
      const flat = JSON.parse(JSON.stringify(data));
      for (const key of flatten(flat as Json)) {
        const value = key.split('.').reduce<unknown>((acc, part) => (acc as Json)?.[part], flat);
        expect(typeof value === 'string' && value.length > 0).toBe(true);
        expect(`${lang}:${key}=${String(value)}`).not.toContain('undefined');
      }
    }
  });

  // Keys referenced via `t(...)` across the app. Keeping this list in sync with
  // the components guards against the key-drift bug where the UI rendered raw
  // keys (e.g. "category.europa", "app.title").
  const REQUIRED_KEYS = [
    'app.title',
    'app.subtitle',
    'category.erdzeitalter',
    'category.zivilisation',
    'category.natur',
    'category.nation',
    'category.herrscher',
    'continent.europa',
    'continent.asien',
    'continent.afrika',
    'continent.amerika',
    'continent.ozeanien',
    'chip.soon',
    'detailLevel.label',
    'detailLevel.core',
    'detailLevel.extended',
    'detailLevel.detail',
    'event.culture',
    'event.million',
    'event.thousand',
    'event.bce',
    'event.ce',
    'zoom.level.0',
    'zoom.level.4',
    'epochNav.stoneAge',
    'epochNav.modern',
    'minimap.label',
    'popover.title',
    'popover.dismiss',
    'axis.today',
  ];

  it.each(REQUIRED_KEYS)('defines required key "%s" in both languages', (key) => {
    expect(deKeys).toContain(key);
    expect(enKeys).toContain(key);
  });
});
