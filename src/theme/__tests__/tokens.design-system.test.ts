import { shadows, animation, zIndex, iconSize, spacing, radii, typography, colors } from '../tokens';

describe('Design-System Tokens', () => {
  describe('shadows', () => {
    it('has sm, md, lg levels', () => {
      expect(shadows.sm).toBeDefined();
      expect(shadows.md).toBeDefined();
      expect(shadows.lg).toBeDefined();
    });

    it('shadow elevation increases sm < md < lg', () => {
      expect(shadows.sm.elevation).toBeLessThan(shadows.md.elevation);
      expect(shadows.md.elevation).toBeLessThan(shadows.lg.elevation);
    });

    it('shadow opacity increases sm < md < lg', () => {
      expect(shadows.sm.shadowOpacity).toBeLessThan(shadows.md.shadowOpacity);
      expect(shadows.md.shadowOpacity).toBeLessThan(shadows.lg.shadowOpacity);
    });
  });

  describe('animation', () => {
    it('fast < normal < slow durations', () => {
      expect(animation.durationFast).toBeLessThan(animation.durationNormal);
      expect(animation.durationNormal).toBeLessThan(animation.durationSlow);
    });

    it('all durations are positive numbers', () => {
      expect(animation.durationFast).toBeGreaterThan(0);
      expect(animation.durationNormal).toBeGreaterThan(0);
      expect(animation.durationSlow).toBeGreaterThan(0);
    });
  });

  describe('zIndex', () => {
    it('stacking order is base < overlay < modal < tooltip', () => {
      expect(zIndex.base).toBeLessThan(zIndex.overlay);
      expect(zIndex.overlay).toBeLessThan(zIndex.modal);
      expect(zIndex.modal).toBeLessThan(zIndex.tooltip);
    });
  });

  describe('iconSize', () => {
    it('icon sizes increase sm < md < lg < xl', () => {
      expect(iconSize.sm).toBeLessThan(iconSize.md);
      expect(iconSize.md).toBeLessThan(iconSize.lg);
      expect(iconSize.lg).toBeLessThan(iconSize.xl);
    });

    it('all icon sizes are positive integers', () => {
      for (const size of Object.values(iconSize)) {
        expect(size).toBeGreaterThan(0);
        expect(Number.isInteger(size)).toBe(true);
      }
    });
  });

  describe('spacing', () => {
    it('spacing scale increases xs < sm < md < lg < xl', () => {
      expect(spacing.xs).toBeLessThan(spacing.sm);
      expect(spacing.sm).toBeLessThan(spacing.md);
      expect(spacing.md).toBeLessThan(spacing.lg);
      expect(spacing.lg).toBeLessThan(spacing.xl);
    });
  });

  describe('radii', () => {
    it('radii increase sm < md < lg < pill', () => {
      expect(radii.sm).toBeLessThan(radii.md);
      expect(radii.md).toBeLessThan(radii.lg);
      expect(radii.lg).toBeLessThan(radii.pill);
    });
  });

  describe('typography', () => {
    it('title is larger than subtitle, body, and caption', () => {
      expect(typography.title.fontSize).toBeGreaterThan(typography.subtitle.fontSize);
      expect(typography.subtitle.fontSize).toBeGreaterThan(typography.body.fontSize);
      expect(typography.body.fontSize).toBeGreaterThan(typography.caption.fontSize);
    });
  });

  describe('color contrast – key pairs', () => {
    it('textPrimary is defined as a hex color', () => {
      expect(colors.textPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('bg and bgElevated are different values', () => {
      expect(colors.bg).not.toBe(colors.bgElevated);
    });

    it('accent color is defined', () => {
      expect(colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
