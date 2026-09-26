import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import '@/i18n';
import i18n from '@/i18n';
import { EpochOverviewScreen } from '../EpochOverviewScreen';
import { LEARNING_JOURNEYS } from '@/data/learningJourneys';
import de from '@/i18n/de.json';
import en from '@/i18n/en.json';

async function setup(overrides?: {
  filterBadgeLabel?: string;
  journeyProgress?: Record<string, number>;
  activeTheme?: string | null;
}) {
  const onSelectEpoch = jest.fn();
  const onShowFullTimeline = jest.fn();
  const onOpenSettings = jest.fn();
  const onOpenSearch = jest.fn();
  const onOpenFilters = jest.fn();
  const onStartJourney = jest.fn();
  const onSelectTheme = jest.fn();
  const utils = await render(
    <EpochOverviewScreen
      onSelectEpoch={onSelectEpoch}
      onShowFullTimeline={onShowFullTimeline}
      onOpenSettings={onOpenSettings}
      onOpenSearch={onOpenSearch}
      onOpenFilters={onOpenFilters}
      filterBadgeLabel={overrides?.filterBadgeLabel}
      onStartJourney={onStartJourney}
      journeyProgress={overrides?.journeyProgress}
      onSelectTheme={onSelectTheme}
      activeTheme={overrides?.activeTheme ?? null}
    />,
  );
  return {
    ...utils,
    onSelectEpoch,
    onShowFullTimeline,
    onOpenSettings,
    onOpenSearch,
    onOpenFilters,
    onStartJourney,
    onSelectTheme,
  };
}

describe('EpochOverviewScreen — Lernreisen/Themen sections (Erkunden-redesign)', () => {
  it('renders all three section titles (Zeitreise, Lernreisen, Themen) on one page', async () => {
    const { getAllByText, getByText } = await setup();
    // "Zeitreise" appears twice: the page header and the section title above the epoch tiles.
    expect(getAllByText(de.epochNav.title)).toHaveLength(2);
    expect(getByText(de.learning.sectionTitle)).toBeTruthy();
    expect(getByText(de.themeSection.title)).toBeTruthy();
  });

  it('renders a tile per learning journey', async () => {
    const { getByLabelText } = await setup();
    for (const journey of LEARNING_JOURNEYS) {
      expect(
        getByLabelText(de.learning.journey[journey.id as keyof typeof de.learning.journey].label),
      ).toBeTruthy();
    }
  });

  it('orders journey tiles alphabetically by their German label', async () => {
    const { getAllByRole } = await setup();
    const labels = LEARNING_JOURNEYS.map(
      (j) => de.learning.journey[j.id as keyof typeof de.learning.journey].label,
    );
    const buttons = getAllByRole('button').map((b) => b.props.accessibilityLabel as string);
    const renderedOrder = buttons.filter((label) => labels.includes(label));
    expect(renderedOrder).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'de')));
  });

  it('tapping a journey tile calls onStartJourney with its id', async () => {
    const journey = LEARNING_JOURNEYS[0]!;
    const label = de.learning.journey[journey.id as keyof typeof de.learning.journey].label;
    const { getByLabelText, onStartJourney } = await setup();
    await fireEvent.press(getByLabelText(label));
    expect(onStartJourney).toHaveBeenCalledWith(journey.id);
  });

  it('shows journey progress when a station index is stored', async () => {
    const journey = LEARNING_JOURNEYS[0]!;
    const { getByText } = await setup({ journeyProgress: { [journey.id]: 1 } });
    expect(getByText(new RegExp(de.learning.continue))).toBeTruthy();
  });

  it('renders a tile per top-level theme, including ones with sub-themes', async () => {
    const { getByLabelText } = await setup();
    expect(getByLabelText(de.theme.kolonialismus.label)).toBeTruthy();
    expect(getByLabelText(de.theme.aufklaerung.label)).toBeTruthy();
  });

  it('tapping a leaf theme (no children) calls onSelectTheme directly', async () => {
    const { getByLabelText, onSelectTheme } = await setup();
    await fireEvent.press(getByLabelText(de.theme.kolonialismus.label));
    expect(onSelectTheme).toHaveBeenCalledWith('kolonialismus');
  });

  it('a theme with sub-themes is not expanded by default, and its sub-themes are hidden', async () => {
    const { queryByLabelText } = await setup();
    expect(queryByLabelText(de.theme.mathematik.label)).toBeNull();
  });

  it('tapping the body of a parent theme expands it to reveal its sub-themes, alphabetically', async () => {
    const { getByLabelText, queryByLabelText } = await setup();
    await fireEvent.press(getByLabelText(de.theme.aufklaerung.label));
    expect(getByLabelText(de.theme.mathematik.label)).toBeTruthy();
    expect(queryByLabelText(de.theme.klima.label)).toBeTruthy();
  });

  it('the trailing jump action on a parent theme selects it directly without requiring expansion', async () => {
    const { getByLabelText, onSelectTheme } = await setup();
    await fireEvent.press(
      getByLabelText(`${de.theme.aufklaerung.label} – ${de.epochNav.openTimeline}`),
    );
    expect(onSelectTheme).toHaveBeenCalledWith('aufklaerung');
  });

  it('renders three "Eigener Filter" tiles (one per section), all opening the same FilterSheet', async () => {
    const { getAllByLabelText, onOpenFilters } = await setup();
    const tiles = getAllByLabelText(de.filterSheet.setOwnFilters);
    expect(tiles).toHaveLength(3);
    for (const tile of tiles) {
      await fireEvent.press(tile);
    }
    expect(onOpenFilters).toHaveBeenCalledTimes(3);
  });

  it('re-sorts journeys/themes when the app language changes', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    try {
      const { getByLabelText } = await setup();
      expect(getByLabelText(en.theme.kolonialismus.label)).toBeTruthy();
    } finally {
      await act(async () => {
        await i18n.changeLanguage('de');
      });
    }
  });
});
