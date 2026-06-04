export type Category = 'erdzeitalter' | 'natur' | 'zivilisation' | 'nation' | 'herrscher';

export const colors = {
  bg: '#0E1116',
  bgElevated: '#171B22',
  surface: '#1F242D',
  border: '#2A313C',
  textPrimary: '#F2F4F8',
  textSecondary: '#A8B0BB',
  textMuted: '#6B7280',
  accent: '#7C9CFF',
  category: {
    erdzeitalter: '#4A8FA8',
    natur: '#4FA86A',
    zivilisation: '#C28B4A',
    nation: '#7C9CFF',
    herrscher: '#CF8A30',
  } as Record<Category, string>,
  laneBg: {
    erdzeitalter: 'rgba(74, 143, 168, 0.10)',
    natur: 'rgba(79, 168, 106, 0.10)',
    zivilisation: 'rgba(194, 139, 74, 0.10)',
    nation: 'rgba(124, 156, 255, 0.10)',
    herrscher: 'rgba(207, 138, 48, 0.10)',
  } as Record<Category, string>,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const LANE_HEIGHT = 84;
export const LANE_GAP = 8;
export const LANE_LABEL_WIDTH = 96;

// Per-category palettes: visually distinct hues that stay within each
// category's tonal range so the lane color still reads as one group.
const CATEGORY_PALETTES: Record<Category, string[]> = {
  erdzeitalter: ['#3D7A90', '#4E8FA8', '#2E6A7A', '#5FA5C2', '#1E5568', '#6BBAD4', '#357088'],
  natur:        ['#3D9957', '#5ABF72', '#2E7A45', '#7AD68A', '#4FB06A', '#236634', '#8FD4A0'],
  zivilisation: ['#B87C3A', '#D49A52', '#C86030', '#E8B468', '#A05C28', '#F0C878', '#7A4420'],
  nation:       ['#5A7AE8', '#8AACFF', '#3A5CC4', '#7090D8', '#A0C0FF', '#4468B0', '#C0D4FF'],
  herrscher:    ['#BF7020', '#D98C38', '#A05810', '#E8A050', '#8C4808', '#F0B868', '#704000'],
};

/** Deterministic hash of a string → integer 0..N-1 */
function hashIndex(s: string, n: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return h % n;
}

/**
 * Returns a stable event color. Uses ev.color if set, otherwise picks a
 * deterministic color from the category palette based on ev.culture ?? ev.id.
 * Events sharing the same culture get the same color.
 */
export function eventColor(ev: { id: string; color?: string; category: Category; culture?: string }): string {
  if (ev.color) return ev.color;
  const palette = CATEGORY_PALETTES[ev.category] ?? CATEGORY_PALETTES.zivilisation;
  const key = ev.culture ?? ev.id;
  return (palette[hashIndex(key, palette.length)] ?? palette[0]) as string;
}
