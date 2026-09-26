import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { EpochOverviewScreen } from '../EpochOverviewScreen';
import de from '@/i18n/de.json';

async function setup() {
  const onSelectEpoch = jest.fn();
  const onShowFullTimeline = jest.fn();
  const onOpenSettings = jest.fn();
  const onOpenSearch = jest.fn();
  const onOpenFilters = jest.fn();
  const onOpenExplore = jest.fn();
  const utils = await render(
    <EpochOverviewScreen
      onSelectEpoch={onSelectEpoch}
      onShowFullTimeline={onShowFullTimeline}
      onOpenSettings={onOpenSettings}
      onOpenSearch={onOpenSearch}
      onOpenFilters={onOpenFilters}
      onOpenExplore={onOpenExplore}
    />,
  );
  return { ...utils, onOpenExplore };
}

describe('EpochOverviewScreen — Explore entry point (#239)', () => {
  it('renders a single Explore card instead of the learning-journey/theme grids', async () => {
    const { getByLabelText, queryByText } = await setup();
    expect(getByLabelText(de.explore.title)).toBeTruthy();
    // Journeys/themes moved to their own screens behind the Explore card.
    expect(queryByText(de.themeSection.title)).toBeNull();
    expect(queryByText(de.learning.sectionTitle)).toBeNull();
  });

  it('tapping the Explore card calls onOpenExplore', async () => {
    const { getByLabelText, onOpenExplore } = await setup();
    await fireEvent.press(getByLabelText(de.explore.title));
    expect(onOpenExplore).toHaveBeenCalled();
  });
});
