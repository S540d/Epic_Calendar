import { eventColor, colors, type Category } from '../tokens';

describe('eventColor', () => {
  const categories: Category[] = ['erdzeitalter', 'natur', 'zivilisation', 'nation', 'herrscher'];

  it('returns ev.color when explicitly set', () => {
    const ev = { color: '#FF0000', category: 'zivilisation' as Category };
    expect(eventColor(ev)).toBe('#FF0000');
  });

  it('returns a hex string for every category when no explicit color', () => {
    for (const cat of categories) {
      const result = eventColor({ category: cat });
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('events without a culture get the stable, neutral category color', () => {
    expect(eventColor({ category: 'zivilisation' })).toBe(colors.category.zivilisation);
  });

  it('two events sharing the same culture get the same color', () => {
    const a = eventColor({ category: 'zivilisation', culture: 'römisch' });
    const b = eventColor({ category: 'zivilisation', culture: 'römisch' });
    expect(a).toBe(b);
  });

  it('two events with different cultures get formula-derived colors', () => {
    const a = eventColor({ category: 'zivilisation', culture: 'römisch' });
    const b = eventColor({ category: 'zivilisation', culture: 'griechisch' });
    expect(a).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(b).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(a).not.toBe(b);
  });

  it('is deterministic: same input always yields same output', () => {
    const ev = { category: 'nation' as Category, culture: 'stable-culture' };
    const first = eventColor(ev);
    expect(eventColor(ev)).toBe(first);
    expect(eventColor(ev)).toBe(first);
  });

  it('falls back to zivilisation color for unknown category', () => {
    const ev = { category: 'unknown' as Category };
    const result = eventColor(ev);
    expect(result).toBe(colors.category.zivilisation);
  });
});

describe('colors design tokens', () => {
  it('all category colors are defined', () => {
    const cats: Category[] = ['erdzeitalter', 'natur', 'zivilisation', 'nation', 'herrscher'];
    for (const c of cats) {
      expect(colors.category[c]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('all laneBg colors are defined and contain rgba', () => {
    const cats: Category[] = ['erdzeitalter', 'natur', 'zivilisation', 'nation', 'herrscher'];
    for (const c of cats) {
      expect(colors.laneBg[c]).toMatch(/^rgba\(/);
    }
  });
});
