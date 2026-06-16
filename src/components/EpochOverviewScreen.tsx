import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { NavigationEpoch } from '@/timeline/epoch';
import { NAVIGATION_EPOCHS } from '@/timeline/epoch';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Props = {
  onSelectEpoch: (startYear: number, endYear: number) => void;
  onShowFullTimeline: () => void;
  onToggleLanguage: () => void;
  currentLanguage: string;
};

const EPOCH_COLORS: Record<string, string> = {
  cosmicDawn: '#6B4BB8',
  earlyEarth: '#4A8FA8',
  paleozoic: '#4FA86A',
  mesozoic: '#B87C3A',
  cenozoic: '#7C9CFF',
  humanHistory: '#C28B4A',
  stoneAge: '#8E9E6A',
  ancientCiv: '#B88B4A',
  antiquity: '#C28B4A',
  middleAges: '#A07040',
  modern: '#CF8A30',
};

function formatDuration(startYear: number, endYear: number, t: TFunction): string {
  const durationYears = Math.abs(endYear - startYear);
  if (durationYears >= 1_000_000_000) {
    return t('epochNav.durationBillion', { n: (durationYears / 1_000_000_000).toFixed(1) });
  }
  if (durationYears >= 1_000_000) {
    return t('epochNav.durationMillion', { n: Math.round(durationYears / 1_000_000) });
  }
  if (durationYears >= 10_000) {
    return t('epochNav.durationThousand', { n: Math.round(durationYears / 1_000) });
  }
  return t('epochNav.durationYears', { n: durationYears.toLocaleString() });
}

function formatYearLabel(year: number, t: TFunction): string {
  if (year >= 2020) return t('event.present');
  const abs = Math.abs(year);
  const suffix = year < 0 ? ` ${t('event.bce')}` : ` ${t('event.ce')}`;
  if (abs >= 1_000_000_000) {
    const n = (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `${n} ${t('axis.billion')}${suffix}`;
  }
  if (abs >= 1_000_000) return `${Math.round(abs / 1_000_000)} ${t('event.million')}${suffix}`;
  const formatted = Math.round(abs)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatted}${suffix}`;
}

type SchematicTimelineProps = {
  onSelectEpoch: (startYear: number, endYear: number) => void;
  activeEpochKey?: string;
};

function SchematicTimeline({ onSelectEpoch, activeEpochKey }: SchematicTimelineProps) {
  const { t } = useTranslation();
  // Only top-level epochs in the schematic bar
  const topLevel = NAVIGATION_EPOCHS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.schematicContainer}
      contentContainerStyle={styles.schematicContent}
    >
      {topLevel.map((epoch) => {
        const color = EPOCH_COLORS[epoch.key] ?? colors.accent;
        const isActive = epoch.key === activeEpochKey;
        return (
          <Pressable
            key={epoch.key}
            style={({ pressed }) => [
              styles.schematicSegment,
              { backgroundColor: color + 'CC' },
              isActive && styles.schematicSegmentActive,
              pressed && styles.schematicSegmentPressed,
            ]}
            onPress={() => onSelectEpoch(epoch.startYear, epoch.endYear)}
            accessibilityRole="button"
            accessibilityLabel={t(`epochNav.${epoch.key}`)}
          >
            {isActive && <View style={[styles.schematicIndicator, { backgroundColor: color }]} />}
            <Text style={styles.schematicLabel} numberOfLines={2}>
              {t(`epochNav.${epoch.key}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type EpochTileProps = {
  epoch: NavigationEpoch;
  onPress: (startYear: number, endYear: number) => void;
  indent?: boolean;
};

function EpochTile({ epoch, onPress, indent = false }: EpochTileProps) {
  const { t } = useTranslation();
  const color = EPOCH_COLORS[epoch.key] ?? colors.accent;
  const handlePress = useCallback(() => onPress(epoch.startYear, epoch.endYear), [onPress, epoch]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        indent && styles.tileIndent,
        pressed && styles.tilePressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t(`epochNav.${epoch.key}`)}
    >
      <View style={[styles.tileAccent, { backgroundColor: color }]} />
      <View style={styles.tileContent}>
        <Text style={styles.tileName}>{t(`epochNav.${epoch.key}`)}</Text>
        <Text style={styles.tileRange}>
          {formatYearLabel(epoch.startYear, t)} – {formatYearLabel(epoch.endYear, t)}
        </Text>
        <View style={[styles.durationBadge, { borderColor: color }]}>
          <Text style={[styles.durationText, { color }]}>
            {formatDuration(epoch.startYear, epoch.endYear, t)}
          </Text>
        </View>
      </View>
      <Text style={styles.tileArrow}>›</Text>
    </Pressable>
  );
}

export function EpochOverviewScreen({
  onSelectEpoch,
  onShowFullTimeline,
  onToggleLanguage,
  currentLanguage,
}: Props) {
  const { t } = useTranslation();

  const handleEpochPress = useCallback(
    (startYear: number, endYear: number) => {
      onSelectEpoch(startYear, endYear);
    },
    [onSelectEpoch],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('epochNav.title')}</Text>
          <Text style={styles.subtitle}>{t('epochNav.subtitle')}</Text>
        </View>
        <Pressable
          style={styles.langToggle}
          onPress={onToggleLanguage}
          accessibilityLabel="Sprache wechseln"
          accessibilityRole="button"
        >
          <Text style={styles.langToggleText}>{currentLanguage === 'de' ? 'EN' : 'DE'}</Text>
        </Pressable>
      </View>

      <SchematicTimeline onSelectEpoch={handleEpochPress} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {NAVIGATION_EPOCHS.map((epoch) => (
          <View key={epoch.key}>
            <EpochTile epoch={epoch} onPress={handleEpochPress} />
            {epoch.children?.map((child) => (
              <EpochTile key={child.key} epoch={child} onPress={handleEpochPress} indent />
            ))}
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.fullTimelineButton,
            pressed && styles.fullTimelinePressed,
          ]}
          onPress={onShowFullTimeline}
          accessibilityRole="button"
        >
          <Text style={styles.fullTimelineText}>{t('epochNav.allTime')} →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  langToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  schematicContainer: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  schematicContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 56,
  },
  schematicSegment: {
    minWidth: 60,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    position: 'relative',
  },
  schematicSegmentActive: {
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255,255,255,0.9)',
  },
  schematicSegmentPressed: {
    opacity: 0.75,
  },
  schematicIndicator: {
    position: 'absolute',
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  schematicLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
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
  tileIndent: {
    marginLeft: spacing.md,
    borderRadius: radii.sm - 2,
  },
  tilePressed: {
    opacity: 0.75,
  },
  tileAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  tileContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tileName: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontSize: 15,
  },
  tileRange: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tileArrow: {
    fontSize: 20,
    color: colors.textMuted,
    paddingRight: spacing.sm,
  },
  fullTimelineButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  fullTimelinePressed: {
    opacity: 0.75,
  },
  fullTimelineText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
});
