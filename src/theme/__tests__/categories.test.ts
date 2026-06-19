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
    ]);
  });

  it('CHIP_CATEGORIES preserves the filter-chip order', () => {
    expect(CHIP_CATEGORIES).toEqual([
      'erdzeitalter',
      'zivilisation',
      'nation',
      'herrscher',
      'natur',
    ]);
  });

  it('LANE_ORDER preserves the lane order (no herrscher lane)', () => {
    expect(LANE_ORDER).toEqual(['erdzeitalter', 'zivilisation', 'natur', 'nation']);
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
    });
  });

  it('lane backgrounds are unchanged', () => {
    expect(CATEGORY_LANE_BG).toEqual({
      erdzeitalter: 'rgba(74, 143, 168, 0.10)',
      natur: 'rgba(79, 168, 106, 0.10)',
      zivilisation: 'rgba(194, 139, 74, 0.10)',
      nation: 'rgba(124, 156, 255, 0.10)',
      herrscher: 'rgba(207, 138, 48, 0.10)',
    });
  });

  it('palettes are unchanged', () => {
    expect(CATEGORY_PALETTES.erdzeitalter).toEqual([
      '#3D7A90',
      '#4E8FA8',
      '#2E6A7A',
      '#5FA5C2',
      '#1E5568',
      '#6BBAD4',
      '#357088',
    ]);
    expect(CATEGORY_PALETTES.natur).toEqual([
      '#3D9957',
      '#5ABF72',
      '#2E7A45',
      '#7AD68A',
      '#4FB06A',
      '#236634',
      '#8FD4A0',
    ]);
    expect(CATEGORY_PALETTES.zivilisation).toEqual([
      '#B87C3A',
      '#D49A52',
      '#C86030',
      '#E8B468',
      '#A05C28',
      '#F0C878',
      '#7A4420',
    ]);
    expect(CATEGORY_PALETTES.nation).toEqual([
      '#5A7AE8',
      '#8AACFF',
      '#3A5CC4',
      '#7090D8',
      '#A0C0FF',
      '#4468B0',
      '#C0D4FF',
    ]);
    expect(CATEGORY_PALETTES.herrscher).toEqual([
      '#BF7020',
      '#D98C38',
      '#A05810',
      '#E8A050',
      '#8C4808',
      '#F0B868',
      '#704000',
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

  it('herrscher is a chip but has no lane (preserved quirk)', () => {
    expect(CHIP_CATEGORIES).toContain('herrscher');
    expect(LANE_ORDER).not.toContain('herrscher');
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
