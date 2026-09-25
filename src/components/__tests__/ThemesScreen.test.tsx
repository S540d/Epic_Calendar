import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { ThemesScreen } from '../ThemesScreen';
import { THEMES } from '@/data/themes';
import de from '@/i18n/de.json';

function setup(overrides?: { activeTheme?: string | null }) {
  const onBack = jest.fn();
  const onSelectTheme = jest.fn();
  const utils = render(
    <ThemesScreen
      onBack={onBack}
      onSelectTheme={onSelectTheme}
      activeTheme={overrides?.activeTheme ?? null}
    />,
  );
  return { ...utils, onBack, onSelectTheme };
}

describe('ThemesScreen (#239, moved from EpochOverviewScreen #226)', () => {
  it('renders a chip per curated theme', () => {
    const { getByText } = setup();
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

  it('tapping the back button calls onBack', () => {
    const { getByLabelText, onBack } = setup();
    fireEvent.press(getByLabelText(de.nav.back));
    expect(onBack).toHaveBeenCalled();
  });
});
