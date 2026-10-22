import { formatEventYear } from '../formatYear';

// Minimal i18n stub: returns the key's last segment as a readable token.
const t = (key: string) =>
  ({
    'event.bce': 'BCE',
    'event.ce': 'CE',
    'event.billion': 'Bn',
    'event.million': 'Mio.',
  })[key] ?? key;

describe('formatEventYear', () => {
  it('rounds small CE years to whole numbers (no decimals)', () => {
    expect(formatEventYear(335.5256571153519, t)).toBe('336 CE');
  });

  it('rounds small BCE years to whole numbers', () => {
    expect(formatEventYear(-752.6, t)).toBe('753 BCE');
  });

  it('formats exact small years without a fractional part', () => {
    expect(formatEventYear(1492, t)).toBe('1,492 CE');
  });

  it('formats thousands with locale separator (no k-suffix)', () => {
    expect(formatEventYear(12_400, t)).toBe('12,400 CE');
  });

  it('formats millions with one decimal', () => {
    expect(formatEventYear(65_400_000, t)).toBe('65.4 Mio. CE');
    expect(formatEventYear(-252_000_000, t)).toBe('252 Mio. BCE');
  });

  it('formats six-digit years as Mio. instead of a raw thousands number', () => {
    expect(formatEventYear(-555_596, t)).toBe('0.6 Mio. BCE');
  });

  it('formats exactly 100,000 as Mio.', () => {
    expect(formatEventYear(100_000, t)).toBe('0.1 Mio. CE');
  });

  it('formats billions with one decimal', () => {
    expect(formatEventYear(-4_500_000_000, t)).toBe('4.5 Bn BCE');
  });

  it('handles year zero', () => {
    expect(formatEventYear(0, t)).toBe('0 CE');
  });

  it('uses the language-specific separators when provided', () => {
    const de = (key: string) =>
      ({
        'number.decimal': ',',
        'number.thousands': '.',
        'event.ce': 'n. Chr.',
        'event.million': 'Mio.',
      })[key] ?? t(key);
    expect(formatEventYear(1492, de)).toBe('1.492 n. Chr.');
    expect(formatEventYear(65_400_000, de)).toBe('65,4 Mio. n. Chr.');
  });
});
