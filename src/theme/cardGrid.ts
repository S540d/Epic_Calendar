import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from './tokens';
import type { ThemeColors } from './ThemeContext';

/**
 * Shared 2-column card grid, used by every discovery entry point (#239):
 * the Explore landing, the full Learning-Journeys grid and the full Themes
 * grid. Extracted from `EpochOverviewScreen` (originally introduced there by
 * #236) so the three screens render the same visual language instead of
 * each re-declaring near-identical StyleSheets.
 */
export function makeCardGridStyles(colors: ThemeColors) {
  return StyleSheet.create({
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    card: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: colors.bgElevated,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
    },
    cardPressed: {
      opacity: 0.75,
    },
    cardActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    cardTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    cardTitleActive: {
      color: colors.bg,
    },
    cardMeta: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    cardMetaActive: {
      color: colors.bg,
    },
  });
}
