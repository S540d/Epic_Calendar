import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '@/theme/tokens';
import { formatEventYear } from '@/timeline/formatYear';

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

// Lineare Erdgeschichts-Achse: von der Erdentstehung bis heute (Modell B, wie die
// interaktive Timeline). Der Urknall liegt davor und wäre auf einer linearen Skala
// nicht darstellbar (würde die gesamte Erdgeschichte zu einem Punkt stauchen),
// deshalb wird er als "außerhalb der Skala" liegender Marker links neben der
// Erdentstehung platziert – beide mit Zeitpunkt, getrennt durch einen Achsenbruch.
const EARTH_FORMATION_YEAR = -4_600_000_000;
const PRESENT_YEAR = 2026;

// Fraktionen der verfügbaren Breite.
const BIG_BANG_FRAC = 0.05; // Urknall-Marker (außerhalb der Skala)
const AXIS_START_FRAC = 0.2; // Beginn der linearen Achse = Erdentstehung

/** Lineare Position eines Jahres auf der Erdgeschichts-Achse (0..1 der Breite). */
function linearPos(year: number): number {
  const clamped = Math.max(EARTH_FORMATION_YEAR, Math.min(PRESENT_YEAR, year));
  const frac = (clamped - EARTH_FORMATION_YEAR) / (PRESENT_YEAR - EARTH_FORMATION_YEAR);
  return AXIS_START_FRAC + frac * (1 - AXIS_START_FRAC);
}

/** X-Position (0..1) eines Landmarks – Urknall liegt außerhalb der linearen Skala. */
function landmarkFrac(lm: Landmark): number {
  return lm.key === 'bigBang' ? BIG_BANG_FRAC : linearPos(lm.year);
}

// Landmarks, die ihren Zeitpunkt anzeigen (Urknall + Erdentstehung stehen "nebeneinander",
// daher Zeitpunkt-Label zur Einordnung des Achsenbruchs).
const SHOW_YEAR = new Set(['bigBang', 'earthFormation']);

const LINE_Y = 65;
const TICK_H = 14;
const LABEL_H = 52;

type Props = {
  onSelectEpoch: (startYear: number, endYear: number) => void;
};

export function LandmarkTimeline({ onSelectEpoch }: Props) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const bigBangX = BIG_BANG_FRAC * width;
  const axisStartX = AXIS_START_FRAC * width;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Lineare Erdgeschichts-Achse */}
      <View style={[styles.line, { top: LINE_Y, left: axisStartX }]} />
      {/* Achsenbruch zwischen Urknall (außerhalb der Skala) und linearer Achse */}
      {width > 0 && (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.preludeLine,
              { top: LINE_Y, left: bigBangX, width: axisStartX - bigBangX },
            ]}
          />
          <Text
            style={[styles.breakGlyph, { top: LINE_Y - 9, left: (bigBangX + axisStartX) / 2 - 6 }]}
          >
            //
          </Text>
        </>
      )}
      <View style={[styles.presentMarker, { top: LINE_Y - 4 }]}>
        <Text style={styles.presentText}>▶</Text>
      </View>

      {width > 0 &&
        LANDMARKS.map((lm, i) => {
          const x = landmarkFrac(lm) * width;
          const above = i % 2 === 0;
          const name = t(`landmark.${lm.key}`);
          const yearStr = formatEventYear(lm.year, t);
          const showYear = SHOW_YEAR.has(lm.key);

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
              accessibilityLabel={`${name}, ${yearStr}`}
            >
              {above ? (
                <>
                  <Text style={[styles.markerLabel, { color: lm.color }]} numberOfLines={2}>
                    {name}
                  </Text>
                  {showYear && (
                    <Text style={styles.yearLabel} numberOfLines={1}>
                      {yearStr}
                    </Text>
                  )}
                  <View style={[styles.tick, { backgroundColor: lm.color }]} />
                </>
              ) : (
                <>
                  <View style={[styles.tick, { backgroundColor: lm.color }]} />
                  <Text style={[styles.markerLabel, { color: lm.color }]} numberOfLines={2}>
                    {name}
                  </Text>
                  {showYear && (
                    <Text style={styles.yearLabel} numberOfLines={1}>
                      {yearStr}
                    </Text>
                  )}
                </>
              )}
            </Pressable>
          );
        })}

      {width > 0 &&
        (() => {
          const dinos = LANDMARKS.find((l) => l.key === 'dinosaurs');
          if (!dinos?.endYear) return null;
          const x1 = linearPos(dinos.year) * width;
          const x2 = linearPos(dinos.endYear) * width;
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
    height: 140,
    position: 'relative',
    marginHorizontal: 4,
    marginVertical: 8,
  },
  line: {
    position: 'absolute',
    right: 24,
    height: 2,
    backgroundColor: colors.border,
  },
  preludeLine: {
    position: 'absolute',
    height: 2,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    opacity: 0.6,
  },
  breakGlyph: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
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
    width: 48,
    marginLeft: -24,
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
  yearLabel: {
    ...typography.caption,
    fontSize: 8,
    lineHeight: 11,
    textAlign: 'center',
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.65,
  },
});
