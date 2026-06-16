import { PRESENT_YEAR } from './scale';

/** A named historical epoch shown as a coloured, clickable segment in the
 *  EpochBand below the time axis. Ranges may have gaps — segments sit at
 *  their real positions and scroll with the timeline canvas.
 *
 *  Keys must match the `epochNav.*` i18n keys so band labels stay in sync
 *  with the EpochChipBar navigation chips. */
export type Epoch = {
  /** i18n key suffix: `epochNav.<key>`. */
  readonly key: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly color: string;
};

export const EPOCHS: readonly Epoch[] = [
  { key: 'cosmicDawn', startYear: -13_800_000_000, endYear: -4_600_000_000, color: '#6B4BB8' },
  { key: 'earlyEarth', startYear: -4_600_000_000, endYear: -541_000_000, color: '#4A8FA8' },
  { key: 'paleozoic', startYear: -541_000_000, endYear: -252_000_000, color: '#4FA86A' },
  { key: 'mesozoic', startYear: -252_000_000, endYear: -66_000_000, color: '#B87C3A' },
  { key: 'cenozoic', startYear: -66_000_000, endYear: -2_580_000, color: '#7C9CFF' },
  { key: 'stoneAge', startYear: -2_580_000, endYear: -10_000, color: '#8E9E6A' },
  { key: 'ancientCiv', startYear: -10_000, endYear: -500, color: '#B88B4A' },
  { key: 'antiquity', startYear: -500, endYear: 500, color: '#C28B4A' },
  { key: 'middleAges', startYear: 500, endYear: 1_500, color: '#A07040' },
  { key: 'modern', startYear: 1_500, endYear: PRESENT_YEAR, color: '#CF8A30' },
];
