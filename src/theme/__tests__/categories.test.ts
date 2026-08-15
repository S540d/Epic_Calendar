import {
  CATEGORIES,
  VALID_CATEGORIES,
  CHIP_CATEGORIES,
  LANE_ORDER,
  DEFAULT_CATEGORIES,
  DISABLED_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_LANE_BG,
  CATEGORY_PALETTES,
  categoryColor,
  categoryLaneBg,
  categoryPalette,
  categoryConfig,
  generatePalette,
  type Category,
} from '../categories';

describe('category registry — derived arrays match the previous hardcoded values', () => {
  it('VALID_CATEGORIES is the full set in declaration order', () => {
    expect(VALID_CATEGORIES).toEqual([
      'erdzeitalter',
      'natur',
      'zivilisation',
      'nation',
      'herrscher',
      'kultur',
    ]);
  });

  it('CHIP_CATEGORIES preserves the filter-chip order', () => {
    expect(CHIP_CATEGORIES).toEqual([
      'erdzeitalter',
      'zivilisation',
      'nation',
      'herrscher',
      'natur',
      'kultur',
    ]);
  });

  it('LANE_ORDER renders all six categories, kultur as the bottom lane', () => {
    expect(LANE_ORDER).toEqual([
      'erdzeitalter',
      'zivilisation',
      'natur',
      'nation',
      'herrscher',
      'kultur',
    ]);
  });

  it('DEFAULT_CATEGORIES includes erdzeitalter, natur, and zivilisation', () => {
    expect(DEFAULT_CATEGORIES).toEqual(['erdzeitalter', 'natur', 'zivilisation']);
  });

  it('DISABLED_CATEGORIES is empty (natur is now enabled)', () => {
    expect(DISABLED_CATEGORIES).toEqual([]);
  });
});

describe('category registry — color/palette values match the previous tokens', () => {
  it('accent colors are unchanged', () => {
    expect(CATEGORY_COLORS).toEqual({
      erdzeitalter: '#4A8FA8',
      natur: '#4FA86A',
      zivilisation: '#C28B4A',
      nation: '#7C9CFF',
      herrscher: '#CF8A30',
      kultur: '#A85FC2',
    });
  });

  it('lane backgrounds are unchanged', () => {
    expect(CATEGORY_LANE_BG).toEqual({
      erdzeitalter: 'rgba(74, 143, 168, 0.10)',
      natur: 'rgba(79, 168, 106, 0.10)',
      zivilisation: 'rgba(194, 139, 74, 0.10)',
      nation: 'rgba(124, 156, 255, 0.10)',
      herrscher: 'rgba(207, 138, 48, 0.10)',
      kultur: 'rgba(168, 95, 194, 0.10)',
    });
  });

  it('palettes are derived from the accent color via generatePalette (#162)', () => {
    for (const c of CATEGORIES) {
      expect(CATEGORY_PALETTES[c.id]).toEqual(generatePalette(c.color));
    }
  });
});

describe('generatePalette (#162 — deterministic, traceable color logic)', () => {
  it('index 0 is always the base color itself', () => {
    expect(generatePalette('#4A8FA8')[0]).toBe('#4A8FA8');
    expect(generatePalette('#A85FC2')[0]).toBe('#A85FC2');
  });

  it('is deterministic (same input → same output)', () => {
    expect(generatePalette('#C28B4A')).toEqual(generatePalette('#C28B4A'));
  });

  it('returns 7 distinct, valid hex colors', () => {
    const palette = generatePalette('#7C9CFF');
    expect(palette).toHaveLength(7);
    expect(new Set(palette).size).toBe(7);
    for (const hex of palette) {
      expect(hex).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('produces a fixed, pinned palette for a known base color', () => {
    expect(generatePalette('#4A8FA8')).toEqual([
      '#4A8FA8',
      '#659CBB',
      '#3C7B88',
      '#85A9C9',
      '#2E6468',
      '#A5BBD7',
      '#204847',
    ]);
  });
});

describe('category registry — internal consistency', () => {
  it('every category has a unique id', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category has a color, laneBg, non-empty palette and labelKey', () => {
    for (const c of CATEGORIES) {
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.laneBg).toMatch(/^rgba\(/);
      expect(c.palette.length).toBeGreaterThan(0);
      expect(c.labelKey).toBe(`category.${c.id}`);
    }
  });

  it('chipOrder and laneOrder values are unique where present', () => {
    const chip = CATEGORIES.filter((c) => c.chipOrder !== undefined).map((c) => c.chipOrder);
    const lane = CATEGORIES.filter((c) => c.laneOrder !== undefined).map((c) => c.laneOrder);
    expect(new Set(chip).size).toBe(chip.length);
    expect(new Set(lane).size).toBe(lane.length);
  });

  it('herrscher is both a chip and a lane', () => {
    expect(CHIP_CATEGORIES).toContain('herrscher');
    expect(LANE_ORDER).toContain('herrscher');
  });
});

describe('category registry — accessor helpers', () => {
  it('categoryColor / categoryLaneBg / categoryPalette match the maps', () => {
    for (const c of CATEGORIES) {
      const id = c.id as Category;
      expect(categoryColor(id)).toBe(CATEGORY_COLORS[id]);
      expect(categoryLaneBg(id)).toBe(CATEGORY_LANE_BG[id]);
      expect(categoryPalette(id)).toEqual(CATEGORY_PALETTES[id]);
    }
  });

  it('categoryConfig returns the full entry', () => {
    expect(categoryConfig('zivilisation')?.color).toBe('#C28B4A');
  });
});
