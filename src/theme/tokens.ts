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
    erdzeitalter: '#8B6F47',
    natur: '#4FA86A',
    zivilisation: '#C28B4A',
    nation: '#7C9CFF',
    herrscher: '#CF8A30',
  } as Record<Category, string>,
  laneBg: {
    erdzeitalter: 'rgba(139, 111, 71, 0.10)',
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
