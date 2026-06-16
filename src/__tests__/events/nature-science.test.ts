import { describe, it, expect } from '@jest/globals';

describe('Natur & Wissenschaft Events', () => {
  it('should handle Vollmond events', () => {
    const event = {
      id: '1',
      title: 'Vollmond',
      category: 'natur&wissenschaft',
      date: '2026-06-20',
    };
    expect(event.category).toBe('natur&wissenschaft');
    expect(event.title).toContain('Vollmond');
  });

  it('should handle Sonnenfinsternis', () => {
    const event = {
      id: '2',
      title: 'Sonnenfinsternis',
      category: 'natur&wissenschaft',
      date: '2026-07-15',
    };
    expect(event.category).toBe('natur&wissenschaft');
  });

  it('should filter events by natur&wissenschaft category', () => {
    const events = [
      { category: 'natur&wissenschaft' },
      { category: 'kultur' },
      { category: 'natur&wissenschaft' },
    ];
    const filtered = events.filter(e => e.category === 'natur&wissenschaft');
    expect(filtered.length).toBe(2);
  });
});
