import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { EpochOverviewScreen } from '../EpochOverviewScreen';
import { THEMES } from '@/data/themes';
import de from '@/i18n/de.json';

function setup(overrides?: { activeTheme?: string | null }) {
  const onSelectEpoch = jest.fn();
  const onShowFullTimeline = jest.fn();
  const onOpenSettings = jest.fn();
  const onOpenSearch = jest.fn();
  const onOpenFilters = jest.fn();
  const onStartJourney = jest.fn();
  const onSelectTheme = jest.fn();
  const utils = render(
    <EpochOverviewScreen
      onSelectEpoch={onSelectEpoch}
      onShowFullTimeline={onShowFullTimeline}
      onOpenSettings={onOpenSettings}
      onOpenSearch={onOpenSearch}
      onOpenFilters={onOpenFilters}
      onStartJourney={onStartJourney}
      onSelectTheme={onSelectTheme}
      activeTheme={overrides?.activeTheme ?? null}
    />,
  );
  return { ...utils, onSelectTheme };
}

describe('EpochOverviewScreen — theme chips (#226)', () => {
  it('renders the theme section with a chip per curated theme', () => {
    const { getByText } = setup();
    expect(getByText(de.themeSection.title)).toBeTruthy();
    for (const theme of THEMES) {
      expect(getByText(de.theme[theme.id as keyof typeof de.theme].label)).toBeTruthy();
    }
  });

  it('tapping a theme chip calls onSelectTheme with its id', () => {
    const theme = THEMES[0]!;
    const label = de.theme[theme.id as keyof typeof de.theme].label;
    const { getByLabelText, onSelectTheme } = setup();
    fireEvent.press(getByLabelText(label));
    expect(onSelectTheme).toHaveBeenCalledWith(theme.id);
  });

  it('tapping the already-active theme chip still calls onSelectTheme (toggle handled by the caller)', () => {
    const theme = THEMES[0]!;
    const label = de.theme[theme.id as keyof typeof de.theme].label;
    const { getByLabelText, onSelectTheme } = setup({ activeTheme: theme.id });
    fireEvent.press(getByLabelText(label));
    expect(onSelectTheme).toHaveBeenCalledWith(theme.id);
  });
});
