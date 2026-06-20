import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '@/theme/tokens';

type Landmark = {
  key: string;
  year: number;
  endYear?: number;
  navStart: number;
  navEnd: number;
  color: string;
};

const LANDMARKS: Landmark[] = [
  {
    key: 'bigBang',
    year: -13_800_000_000,
    navStart: -13_800_000_000,
    navEnd: -4_600_000_000,
    color: '#6B4BB8',
  },
  {
    key: 'earthFormation',
    year: -4_600_000_000,
    navStart: -4_600_000_000,
    navEnd: -541_000_000,
    color: '#4A8FA8',
  },
  {
    key: 'moonFormation',
    year: -4_500_000_000,
    navStart: -4_600_000_000,
    navEnd: -541_000_000,
    color: '#7BAAC8',
  },
  {
    key: 'firstLife',
    year: -3_800_000_000,
    navStart: -4_600_000_000,
    navEnd: -541_000_000,
    color: '#4FA86A',
  },
  {
    key: 'dinosaurs',
    year: -252_000_000,
    endYear: -66_000_000,
    navStart: -252_000_000,
    navEnd: -66_000_000,
    color: '#B87C3A',
  },
  { key: 'firstHominids', year: -2_500_000, navStart: -2_580_000, navEnd: 2026, color: '#C28B4A' },
];

const MIN_LOG = Math.log10(Math.abs(LANDMARKS[LANDMARKS.length - 1]!.year));
const MAX_LOG = Math.log10(Math.abs(LANDMARKS[0]!.year));

function logPos(year: number): number {
  const log = Math.log10(Math.abs(year));
  return 1 - (log - MIN_LOG) / (MAX_LOG - MIN_LOG);
}

const LINE_Y = 65;
const TICK_H = 14;
const LABEL_H = 40;

type Props = {
  onSelectEpoch: (startYear: number, endYear: number) => void;
};

export function LandmarkTimeline({ onSelectEpoch }: Props) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={[styles.line, { top: LINE_Y }]} />
      <View style={[styles.presentMarker, { top: LINE_Y - 4 }]}>
        <Text style={styles.presentText}>▶</Text>
      </View>

      {width > 0 &&
        LANDMARKS.map((lm, i) => {
          const x = logPos(lm.year) * width;
          const above = i % 2 === 0;

          return (
            <Pressable
              key={lm.key}
              style={({ pressed }: { pressed: boolean }) => [
                styles.markerWrapper,
                above ? styles.markerAbove : styles.markerBelow,
                { left: x },
                pressed && styles.pressed,
              ]}
              onPress={() => onSelectEpoch(lm.navStart, lm.navEnd)}
              accessibilityRole="button"
              accessibilityLabel={t(`landmark.${lm.key}`)}
            >
              {above ? (
                <>
                  <Text style={[styles.markerLabel, { color: lm.color }]} numberOfLines={2}>
                    {t(`landmark.${lm.key}`)}
                  </Text>
                  <View style={[styles.tick, { backgroundColor: lm.color }]} />
                </>
              ) : (
                <>
                  <View style={[styles.tick, { backgroundColor: lm.color }]} />
                  <Text style={[styles.markerLabel, { color: lm.color }]} numberOfLines={2}>
                    {t(`landmark.${lm.key}`)}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}

      {width > 0 &&
        (() => {
          const dinos = LANDMARKS.find((l) => l.key === 'dinosaurs');
          if (!dinos?.endYear) return null;
          const x1 = logPos(dinos.year) * width;
          const x2 = logPos(dinos.endYear) * width;
          return (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: LINE_Y - 3,
                left: x1,
                width: Math.max(2, x2 - x1),
                height: 6,
                backgroundColor: dinos.color + '88',
                borderRadius: 3,
              }}
            />
          );
        })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 130,
    position: 'relative',
    marginHorizontal: 4,
    marginVertical: 8,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 24,
    height: 2,
    backgroundColor: colors.border,
  },
  presentMarker: {
    position: 'absolute',
    right: 4,
  },
  presentText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  markerWrapper: {
    position: 'absolute',
    width: 44,
    marginLeft: -22,
    alignItems: 'center',
  },
  markerAbove: {
    top: LINE_Y - TICK_H - LABEL_H,
    height: TICK_H + LABEL_H,
    justifyContent: 'flex-end',
  },
  markerBelow: {
    top: LINE_Y,
    height: TICK_H + LABEL_H,
    justifyContent: 'flex-start',
  },
  tick: {
    width: 2,
    height: TICK_H,
  },
  markerLabel: {
    ...typography.caption,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});
