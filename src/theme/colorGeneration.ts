/**
 * Formula-driven per-culture color generation (#162).
 *
 * Replaces a fixed, hand-picked palette-per-category array (which collides
 * heavily once the number of distinct `culture` values exceeds the palette
 * size) with an HSL formula: the category's base color supplies a fixed hue
 * (preserves the "category = color family" grouping), while saturation,
 * lightness and a small hue jitter are derived deterministically from the
 * `culture` string. This scales to any number of cultures with no new
 * hardcoded values and no growing collision rate.
 *
 * Always returns hex, never `hsl()` CSS strings — the same value is consumed
 * by both react-native-skia (native `<Rect color=.../>`) and RN-Web
 * (`style.backgroundColor`); hex is the one format both reliably accept.
 */

type HSL = { h: number; s: number; l: number };

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      break;
    case gn:
      h = ((bn - rn) / d + 2) * 60;
      break;
    default:
      h = ((rn - gn) / d + 4) * 60;
      break;
  }

  return { h, s: s * 100, l: l * 100 };
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function toHex(channel: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(channel)));
  return clamped.toString(16).padStart(2, '0');
}

/** Convert an HSL triple (h: 0-360, s/l: 0-100) into a '#rrggbb' hex string. */
export function hslToHex(h: number, s: number, l: number): string {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = s / 100;
  const ln = l / 100;

  if (sn === 0) {
    const gray = toHex(ln * 255);
    return `#${gray}${gray}${gray}`;
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const r = hueToRgbChannel(p, q, hn + 1 / 3) * 255;
  const g = hueToRgbChannel(p, q, hn) * 255;
  const b = hueToRgbChannel(p, q, hn - 1 / 3) * 255;

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Extract the hue (0-360) of a category's base accent color. */
export function categoryHue(categoryColorHex: string): number {
  const { r, g, b } = hexToRgb(categoryColorHex);
  return rgbToHsl(r, g, b).h;
}

/** Deterministic string → 0..1 float, salted for independent axes. */
function hashUnit(s: string, salt: string): number {
  let h = 0;
  const input = `${salt}:${s}`;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) >>> 0;
  }
  return h / 0xffffffff;
}

/** Legibility bounds against the dark canvas background (`colors.bg #0E1116`). */
const SAT_MIN = 45;
const SAT_MAX = 85;
const LIGHT_MIN = 42;
const LIGHT_MAX = 68;
/** Keeps generated colors unambiguously within the category's hue family. */
const HUE_JITTER_DEG = 6;

/**
 * Deterministically generates a tonal variation of a category's hue for a
 * given culture. Same category + culture always produces the same color;
 * different cultures spread across saturation, lightness and a small hue
 * jitter so the color space scales far beyond a fixed small palette.
 */
export function generateCultureColor(categoryColorHex: string, culture: string): string {
  const hue = categoryHue(categoryColorHex);
  const jitter = (hashUnit(culture, 'hue') - 0.5) * 2 * HUE_JITTER_DEG;
  const s = SAT_MIN + hashUnit(culture, 'sat') * (SAT_MAX - SAT_MIN);
  const l = LIGHT_MIN + hashUnit(culture, 'light') * (LIGHT_MAX - LIGHT_MIN);
  return hslToHex(hue + jitter, s, l);
}

/**
 * Resolves the color for a category + optional culture: a stable neutral
 * (the flat category color) when `culture` is absent, otherwise a
 * deterministic per-culture tonal variation.
 */
export function eventColorFor(categoryColorHex: string, culture: string | undefined): string {
  if (!culture) return categoryColorHex;
  return generateCultureColor(categoryColorHex, culture);
}
