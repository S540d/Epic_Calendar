import { eventColor, colors, type Category } from '../tokens';

describe('eventColor', () => {
  const categories: Category[] = ['erdzeitalter', 'natur', 'zivilisation', 'nation', 'herrscher'];

  it('returns ev.color when explicitly set', () => {
    const ev = { id: 'x', color: '#FF0000', category: 'zivilisation' as Category };
    expect(eventColor(ev)).toBe('#FF0000');
  });

  it('returns a hex string for every category when no explicit color', () => {
    for (const cat of categories) {
      const result = eventColor({ id: 'test', category: cat });
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('two events sharing the same culture get the same color', () => {
    const a = eventColor({ id: 'a1', category: 'zivilisation', culture: 'römisch' });
    const b = eventColor({ id: 'b2', category: 'zivilisation', culture: 'römisch' });
    expect(a).toBe(b);
  });

  it('two events with different cultures get palette-keyed colors', () => {
    const a = eventColor({ id: 'a', category: 'zivilisation', culture: 'römisch' });
    const b = eventColor({ id: 'b', category: 'zivilisation', culture: 'griechisch' });
    // May or may not differ (hash collision possible), just verify they're valid hex
    expect(a).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(b).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('is deterministic: same input always yields same output', () => {
    const ev = { id: 'stable-id', category: 'nation' as Category };
    const first = eventColor(ev);
    expect(eventColor(ev)).toBe(first);
    expect(eventColor(ev)).toBe(first);
  });

  it('falls back to zivilisation palette for unknown category', () => {
    const ev = { id: 'x', category: 'unknown' as Category };
    const result = eventColor(ev);
    expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
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
