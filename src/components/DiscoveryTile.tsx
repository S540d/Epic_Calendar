import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@/theme/tokens';
import { useTheme, type ThemeColors } from '@/theme/ThemeContext';

/**
 * Generic accordion node powering the landing page's "Erkunden" section
 * (Lernreisen/Themen/Eigener Filter), which mirrors "Zeitreise": a heading
 * followed by top-level categories that expand exactly like the epoch tiles
 * do. Mirrors `EpochOverviewScreen`'s `EpochTile`/`NavigationEpoch` pattern
 * (body tap toggles when there are children, otherwise triggers `onPress`;
 * a trailing button triggers `onPress` directly when there are children —
 * omitted entirely when a node has children but no `onPress`, e.g. the
 * "Lernreisen"/"Themen" wrapper nodes, which are pure toggles). Visually
 * matches `EpochTile` on purpose (same accent bar + bordered meta badge) so
 * the "Erkunden" section reads as the same kind of list as "Zeitreise" —
 * `node.color` defaults to the app's accent color when unset, since these
 * nodes (unlike epochs) have no meaningful per-item color of their own.
 */
export type TileNode = {
  key: string;
  label: string;
  color?: string;
  /** Short one-line explanation shown under the label (e.g. a journey's or theme's blurb). */
  description?: string;
  meta?: string;
  children?: readonly TileNode[];
  onPress?: () => void;
};

/**
 * Flattens a tree into a level-tagged list, following a node's children only
 * while it's expanded — the same "flatten the visible part of the tree"
 * approach `EpochOverviewScreen` uses for epochs.
 */
export function flattenTiles(
  nodes: readonly TileNode[],
  expandedKeys: ReadonlySet<string>,
  level: 0 | 1 | 2 = 0,
): Array<{ node: TileNode; level: 0 | 1 | 2 }> {
  return nodes.flatMap((node) => {
    const entry = { node, level };
    const hasChildren = (node.children?.length ?? 0) > 0;
    if (!hasChildren || !expandedKeys.has(node.key) || level >= 2) return [entry];
    return [entry, ...flattenTiles(node.children!, expandedKeys, (level + 1) as 0 | 1 | 2)];
  });
}

type Props = {
  node: TileNode;
  level?: 0 | 1 | 2;
  isExpanded?: boolean;
  onToggle?: (key: string) => void;
  isActive?: boolean;
};

export function DiscoveryTile({ node, level = 0, isExpanded = false, onToggle, isActive }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeDiscoveryTileStyles(colors), [colors]);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const indentStyle =
    level === 1 ? styles.tileIndent : level === 2 ? styles.tileIndent2 : undefined;
  const color = node.color ?? colors.accent;

  const handleToggle = () => onToggle?.(node.key);

  return (
    <View style={[styles.tile, indentStyle, isActive && styles.tileActive]}>
      <View style={[styles.tileAccent, { backgroundColor: color }]} />
      <Pressable
        style={({ pressed }) => [styles.tileBody, pressed && styles.tilePressed]}
        onPress={hasChildren ? handleToggle : node.onPress}
        accessibilityRole="button"
        accessibilityLabel={node.label}
        accessibilityState={
          hasChildren ? { expanded: isExpanded, selected: isActive } : { selected: isActive }
        }
        accessibilityHint={
          hasChildren ? t(isExpanded ? 'epochNav.collapse' : 'epochNav.expand') : undefined
        }
      >
        <View style={styles.tileNameRow}>
          {hasChildren && <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>}
          <Text style={[styles.tileName, isActive && styles.tileNameActive]}>{node.label}</Text>
        </View>
        {node.description && <Text style={styles.tileDescription}>{node.description}</Text>}
        {node.meta && (
          <View style={[styles.metaBadge, { borderColor: color }]}>
            <Text style={[styles.metaBadgeText, { color }]}>{node.meta}</Text>
          </View>
        )}
      </Pressable>
      {hasChildren && node.onPress ? (
        <Pressable
          style={({ pressed }) => [styles.jumpButton, pressed && styles.tilePressed]}
          onPress={node.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${node.label} – ${t('epochNav.openTimeline')}`}
        >
          <Text style={styles.jumpArrow}>→</Text>
        </Pressable>
      ) : (
        !hasChildren && <Text style={styles.tileArrow}>›</Text>
      )}
    </View>
  );
}

function makeDiscoveryTileStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    tileActive: {
      borderColor: colors.accent,
    },
    tileIndent: {
      marginLeft: spacing.md,
      borderRadius: radii.sm - 2,
    },
    tileIndent2: {
      marginLeft: spacing.md * 2,
      borderRadius: radii.sm - 2,
    },
    tilePressed: {
      opacity: 0.75,
    },
    tileAccent: {
      width: 4,
      alignSelf: 'stretch',
    },
    tileBody: {
      flex: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    tileNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    chevron: {
      fontSize: 12,
      color: colors.textMuted,
    },
    tileName: {
      ...typography.subtitle,
      color: colors.textPrimary,
      fontSize: 15,
    },
    tileNameActive: {
      color: colors.accent,
    },
    tileDescription: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    metaBadge: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radii.pill,
      borderWidth: 1,
    },
    metaBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    jumpButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    jumpArrow: {
      fontSize: 18,
      color: colors.accent,
    },
    tileArrow: {
      fontSize: 20,
      color: colors.textMuted,
      paddingRight: spacing.sm,
    },
  });
}
