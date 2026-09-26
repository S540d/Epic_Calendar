import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { ExploreScreen } from '../ExploreScreen';
import de from '@/i18n/de.json';

async function setup(overrides?: { filterBadgeLabel?: string }) {
  const onBack = jest.fn();
  const onOpenFilters = jest.fn();
  const onOpenJourneys = jest.fn();
  const onOpenThemes = jest.fn();
  const utils = await render(
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
  it('renders all three discovery entry points', async () => {
    const { getByLabelText } = await setup();
    expect(getByLabelText(de.filterSheet.title)).toBeTruthy();
    expect(getByLabelText(de.learning.sectionTitle)).toBeTruthy();
    expect(getByLabelText(de.themeSection.title)).toBeTruthy();
  });

  it('routes each card to its own callback', async () => {
    const { getByLabelText, onOpenFilters, onOpenJourneys, onOpenThemes } = await setup();
    await fireEvent.press(getByLabelText(de.filterSheet.title));
    expect(onOpenFilters).toHaveBeenCalled();
    await fireEvent.press(getByLabelText(de.learning.sectionTitle));
    expect(onOpenJourneys).toHaveBeenCalled();
    await fireEvent.press(getByLabelText(de.themeSection.title));
    expect(onOpenThemes).toHaveBeenCalled();
  });

  it('tapping the back button calls onBack', async () => {
    const { getByLabelText, onBack } = await setup();
    await fireEvent.press(getByLabelText(de.nav.back));
    expect(onBack).toHaveBeenCalled();
  });
});
