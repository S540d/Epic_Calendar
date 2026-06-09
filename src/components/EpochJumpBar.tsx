import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tToYear } from '@/timeline/scale';
import { T_MAX } from '@/timeline/lod';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Epoch = {
  readonly key: string;
  readonly startYear: number;
  readonly endYear: number;
};

const PRESENT_YEAR = Math.floor(tToYear(T_MAX));

const EPOCHS: readonly Epoch[] = [
  { key: 'bigBang',     startYear: -13_800_000_000, endYear: -13_000_000_000 },
  { key: 'earth',       startYear: -4_600_000_000,  endYear: -3_500_000_000  },
  { key: 'dinosaurs',   startYear: -252_000_000,    endYear: -66_000_000     },
  { key: 'earlyHumans', startYear: -300_000,        endYear: -10_000         },
  { key: 'antiquity',   startYear: -3_000,           endYear: 500             },
  { key: 'middleAges',  startYear: 500,              endYear: 1_500           },
  { key: 'modern',      startYear: 1_500,            endYear: PRESENT_YEAR   },
];

type ChipProps = {
  epoch: Epoch;
  onJump: (startYear: number, endYear: number | null | undefined) => void;
};

function EpochChip({ epoch, onJump }: ChipProps) {
  const { t } = useTranslation();
  const handlePress = useCallback(
    () => onJump(epoch.startYear, epoch.endYear),
    [onJump, epoch.startYear, epoch.endYear],
  );
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t(`epochChip.${epoch.key}`)}
    >
      <Text style={styles.label}>{t(`epochChip.${epoch.key}`)}</Text>
    </Pressable>
  );
}

type Props = {
  onJump: (startYear: number, endYear: number | null | undefined) => void;
};

export function EpochJumpBar({ onJump }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.bar}
    >
      {EPOCHS.map((epoch) => (
        <EpochChip key={epoch.key} epoch={epoch} onJump={onJump} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 28,
    justifyContent: 'center',
  },
  chipPressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
