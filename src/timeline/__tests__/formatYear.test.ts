import { formatEventYear } from '../formatYear';

// Minimal i18n stub: returns the key's last segment as a readable token.
const t = (key: string) =>
  ({
    'event.bce': 'BCE',
    'event.ce': 'CE',
    'event.thousand': 'k',
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
    expect(formatEventYear(1492, t)).toBe('1492 CE');
  });

  it('formats thousands rounded', () => {
    expect(formatEventYear(12_400, t)).toBe('12 k CE');
  });

  it('formats millions rounded', () => {
    expect(formatEventYear(65_400_000, t)).toBe('65 Mio. CE');
  });

  it('handles year zero', () => {
    expect(formatEventYear(0, t)).toBe('0 CE');
  });
});
