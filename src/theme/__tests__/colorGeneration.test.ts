import fs from 'fs';
import path from 'path';
import { categoryHue, generateCultureColor, eventColorFor, hslToHex } from '../colorGeneration';
import { CATEGORIES } from '../categories';

const CATEGORY_COLOR_HEXES = CATEGORIES.map((c) => c.color);

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s: s * 100, l: l * 100 };
}

function loadRealCultures(): string[] {
  const eventsDir = path.join(__dirname, '..', '..', 'data', 'events');
  const files = fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith('.json') && f !== 'detail-level.json');
  const cultures = new Set<string>();
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8'));
    const events = Array.isArray(raw) ? raw : Object.values(raw)[0];
    for (const ev of events as { culture?: string }[]) {
      if (ev.culture) cultures.add(ev.culture);
    }
  }
  return [...cultures];
}

describe('hslToHex', () => {
  it('round-trips known category colors within rounding tolerance', () => {
    for (const hex of CATEGORY_COLOR_HEXES) {
      const { h, s, l } = rgbToHsl(hex);
      const back = hslToHex(h, s, l);
      const a = hexToRgb(hex);
      const b = hexToRgb(back);
      expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(1);
    }
  });
});

describe('categoryHue', () => {
  it('extracts a hue in [0, 360) for every category base color', () => {
    for (const hex of CATEGORY_COLOR_HEXES) {
      const hue = categoryHue(hex);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
});

describe('generateCultureColor', () => {
  it('is deterministic: same category + culture always yields the same color', () => {
    const a = generateCultureColor('#C28B4A', 'maya');
    const b = generateCultureColor('#C28B4A', 'maya');
    expect(a).toBe(b);
  });

  it('returns valid hex for a large synthetic set of cultures', () => {
    for (let i = 0; i < 500; i++) {
      const color = generateCultureColor('#7C9CFF', `culture-${i}`);
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('stays within the category hue family (small jitter, wraparound-safe)', () => {
    for (const baseHex of CATEGORY_COLOR_HEXES) {
      const baseHue = categoryHue(baseHex);
      for (let i = 0; i < 300; i++) {
        const color = generateCultureColor(baseHex, `culture-${i}`);
        const { h } = rgbToHsl(color);
        expect(hueDistance(h, baseHue)).toBeLessThanOrEqual(6.5);
      }
    }
  });

  it('keeps saturation and lightness within legibility bounds', () => {
    for (let i = 0; i < 300; i++) {
      const color = generateCultureColor('#4FA86A', `culture-${i}`);
      const { s, l } = rgbToHsl(color);
      expect(s).toBeGreaterThanOrEqual(44);
      expect(s).toBeLessThanOrEqual(86);
      expect(l).toBeGreaterThanOrEqual(41);
      expect(l).toBeLessThanOrEqual(69);
    }
  });

  it('the same culture string in different categories yields different hues', () => {
    const a = generateCultureColor('#C28B4A', 'maya'); // zivilisation
    const b = generateCultureColor('#A85FC2', 'maya'); // kultur
    const { h: ha } = rgbToHsl(a);
    const { h: hb } = rgbToHsl(b);
    expect(hueDistance(ha, hb)).toBeGreaterThan(10);
  });

  it('scales to the real dataset: >85% distinct colors for all real cultures within one category', () => {
    const cultures = loadRealCultures();
    expect(cultures.length).toBeGreaterThan(100);
    const colors = new Set(cultures.map((c) => generateCultureColor('#C28B4A', c)));
    // Old fixed 7-slot palette gave at most 7 distinct colors for 150+ cultures (~5% unique);
    // the formula gets close to fully unique instead.
    expect(colors.size / cultures.length).toBeGreaterThan(0.85);
  });
});

describe('eventColorFor', () => {
  it('returns the flat category color when culture is absent', () => {
    expect(eventColorFor('#4A8FA8', undefined)).toBe('#4A8FA8');
  });

  it('returns a generated color when culture is present', () => {
    expect(eventColorFor('#4A8FA8', 'ägyptisch')).toBe(
      generateCultureColor('#4A8FA8', 'ägyptisch'),
    );
  });
});
