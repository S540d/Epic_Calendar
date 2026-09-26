import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { ExploreScreen } from '../ExploreScreen';
import de from '@/i18n/de.json';

function setup(overrides?: { filterBadgeLabel?: string }) {
  const onBack = jest.fn();
  const onOpenFilters = jest.fn();
  const onOpenJourneys = jest.fn();
  const onOpenThemes = jest.fn();
  const utils = render(
    <ExploreScreen
      onBack={onBack}
      onOpenFilters={onOpenFilters}
      onOpenJourneys={onOpenJourneys}
      onOpenThemes={onOpenThemes}
      filterBadgeLabel={overrides?.filterBadgeLabel}
    />,
  );
  return { ...utils, onBack, onOpenFilters, onOpenJourneys, onOpenThemes };
}

describe('ExploreScreen (#239)', () => {
  it('renders all three discovery entry points', () => {
    const { getByLabelText } = setup();
    expect(getByLabelText(de.filterSheet.title)).toBeTruthy();
    expect(getByLabelText(de.learning.sectionTitle)).toBeTruthy();
    expect(getByLabelText(de.themeSection.title)).toBeTruthy();
  });

  it('routes each card to its own callback', () => {
    const { getByLabelText, onOpenFilters, onOpenJourneys, onOpenThemes } = setup();
    fireEvent.press(getByLabelText(de.filterSheet.title));
    expect(onOpenFilters).toHaveBeenCalled();
    fireEvent.press(getByLabelText(de.learning.sectionTitle));
    expect(onOpenJourneys).toHaveBeenCalled();
    fireEvent.press(getByLabelText(de.themeSection.title));
    expect(onOpenThemes).toHaveBeenCalled();
  });

  it('tapping the back button calls onBack', () => {
    const { getByLabelText, onBack } = setup();
    fireEvent.press(getByLabelText(de.nav.back));
    expect(onBack).toHaveBeenCalled();
  });
});
