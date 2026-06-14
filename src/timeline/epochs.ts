import { PRESENT_YEAR } from './scale';

/** A named historical epoch shown as a coloured, clickable segment in the
 *  EpochBand below the time axis. Ranges may have gaps (e.g. between the
 *  early Earth and the dinosaurs) — segments sit at their real positions. */
export type Epoch = {
  /** i18n key suffix: `epochChip.<key>`. */
  readonly key: string;
  readonly startYear: number;
  readonly endYear: number;
  /** Segment fill colour (the band uses this at reduced opacity). */
  readonly color: string;
};

export const EPOCHS: readonly Epoch[] = [
  { key: 'earth', startYear: -4_600_000_000, endYear: -3_500_000_000, color: '#4A8FA8' },
  { key: 'dinosaurs', startYear: -252_000_000, endYear: -66_000_000, color: '#4FA86A' },
  { key: 'earlyHumans', startYear: -300_000, endYear: -10_000, color: '#A88B4F' },
  { key: 'antiquity', startYear: -3_000, endYear: 500, color: '#C28B4A' },
  { key: 'middleAges', startYear: 500, endYear: 1_500, color: '#B0683A' },
  { key: 'modern', startYear: 1_500, endYear: PRESENT_YEAR, color: '#7C9CFF' },
];
