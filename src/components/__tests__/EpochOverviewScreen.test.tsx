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

describe('EpochOverviewScreen — Erkunden mirrors Zeitreise (Lernreisen/Themen/Eigener Filter as level-0 categories)', () => {
  it('renders Zeitreise and Erkunden as the only two section titles', async () => {
    const { getAllByText, getByText } = await setup();
    // "Zeitreise" appears twice: the page header and the section title above the epoch tiles.
    expect(getAllByText(de.epochNav.title)).toHaveLength(2);
    expect(getByText(de.explore.title)).toBeTruthy();
  });

  it('shows Lernreisen, Themen and Eigener Filter as collapsed top-level tiles under Erkunden', async () => {
    const { getByLabelText, queryByLabelText } = await setup();
    expect(getByLabelText(de.learning.sectionTitle)).toBeTruthy();
    expect(getByLabelText(de.themeSection.title)).toBeTruthy();
    expect(getByLabelText(de.filterSheet.setOwnFilters)).toBeTruthy();
    // Individual journeys/themes are hidden until their parent tile is expanded.
    expect(queryByLabelText(de.learning.journey['grosse-reise'].label)).toBeNull();
    expect(queryByLabelText(de.theme.kolonialismus.label)).toBeNull();
  });

  it('tapping the "Lernreisen" tile body expands it to reveal every journey, alphabetically', async () => {
    const { getByLabelText, getAllByRole } = await setup();
    await fireEvent.press(getByLabelText(de.learning.sectionTitle));
    for (const journey of LEARNING_JOURNEYS) {
      expect(
        getByLabelText(de.learning.journey[journey.id as keyof typeof de.learning.journey].label),
      ).toBeTruthy();
    }
    const labels = LEARNING_JOURNEYS.map(
      (j) => de.learning.journey[j.id as keyof typeof de.learning.journey].label,
    );
    const buttons = getAllByRole('button').map((b) => b.props.accessibilityLabel as string);
    const renderedOrder = buttons.filter((label) => labels.includes(label));
    expect(renderedOrder).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'de')));
  });

  it("shows each journey's short description once expanded", async () => {
    const journey = LEARNING_JOURNEYS[0]!;
    const description = de.learning.journey[journey.id as keyof typeof de.learning.journey]
      .description as string;
    const { getByLabelText, getByText } = await setup();
    await fireEvent.press(getByLabelText(de.learning.sectionTitle));
    expect(getByText(description)).toBeTruthy();
  });

  it('tapping the "Lernreisen" tile has no jump action (it only toggles, unlike a parent epoch)', async () => {
    const { queryByLabelText } = await setup();
    expect(
      queryByLabelText(`${de.learning.sectionTitle} – ${de.epochNav.openTimeline}`),
    ).toBeNull();
  });

  it('tapping an expanded journey tile calls onStartJourney with its id', async () => {
    const journey = LEARNING_JOURNEYS[0]!;
    const label = de.learning.journey[journey.id as keyof typeof de.learning.journey].label;
    const { getByLabelText, onStartJourney } = await setup();
    await fireEvent.press(getByLabelText(de.learning.sectionTitle));
    await fireEvent.press(getByLabelText(label));
    expect(onStartJourney).toHaveBeenCalledWith(journey.id);
  });

  it('shows journey progress when a station index is stored', async () => {
    const journey = LEARNING_JOURNEYS[0]!;
    const { getByLabelText, getByText } = await setup({ journeyProgress: { [journey.id]: 1 } });
    await fireEvent.press(getByLabelText(de.learning.sectionTitle));
    expect(getByText(new RegExp(de.learning.continue))).toBeTruthy();
  });

  it('tapping the "Themen" tile body expands it to reveal every top-level theme, alphabetically', async () => {
    const { getByLabelText } = await setup();
    await fireEvent.press(getByLabelText(de.themeSection.title));
    expect(getByLabelText(de.theme.kolonialismus.label)).toBeTruthy();
    expect(getByLabelText(de.theme.aufklaerung.label)).toBeTruthy();
  });

  it("shows each theme's short description once expanded", async () => {
    const { getByLabelText, getByText } = await setup();
    await fireEvent.press(getByLabelText(de.themeSection.title));
    expect(getByText(de.theme.kolonialismus.description)).toBeTruthy();
  });

  it('tapping a leaf theme (no sub-themes) calls onSelectTheme directly', async () => {
    const { getByLabelText, onSelectTheme } = await setup();
    await fireEvent.press(getByLabelText(de.themeSection.title));
    await fireEvent.press(getByLabelText(de.theme.kolonialismus.label));
    expect(onSelectTheme).toHaveBeenCalledWith('kolonialismus');
  });

  it('a theme with sub-themes is not expanded by default, and its sub-themes are hidden', async () => {
    const { getByLabelText, queryByLabelText } = await setup();
    await fireEvent.press(getByLabelText(de.themeSection.title));
    expect(queryByLabelText(de.theme.mathematik.label)).toBeNull();
  });

  it('tapping the body of a parent theme expands it to reveal its sub-themes, alphabetically', async () => {
    const { getByLabelText, queryByLabelText } = await setup();
    await fireEvent.press(getByLabelText(de.themeSection.title));
    await fireEvent.press(getByLabelText(de.theme.aufklaerung.label));
    expect(getByLabelText(de.theme.mathematik.label)).toBeTruthy();
    expect(queryByLabelText(de.theme.klima.label)).toBeTruthy();
  });

  it('the trailing jump action on a parent theme selects it directly without requiring expansion', async () => {
    const { getByLabelText, onSelectTheme } = await setup();
    await fireEvent.press(getByLabelText(de.themeSection.title));
    await fireEvent.press(
      getByLabelText(`${de.theme.aufklaerung.label} – ${de.epochNav.openTimeline}`),
    );
    expect(onSelectTheme).toHaveBeenCalledWith('aufklaerung');
  });

  it('renders exactly one "Eigener Filter" tile, opening the FilterSheet', async () => {
    const { getAllByLabelText, onOpenFilters } = await setup();
    const tiles = getAllByLabelText(de.filterSheet.setOwnFilters);
    expect(tiles).toHaveLength(1);
    await fireEvent.press(tiles[0]!);
    expect(onOpenFilters).toHaveBeenCalledTimes(1);
  });

  it('renders "Ganzen Zeitstrahl" as an Erkunden tile (not a separate button under Zeitreise) and calls onShowFullTimeline', async () => {
    const { getByLabelText, onShowFullTimeline } = await setup();
    await fireEvent.press(getByLabelText(de.epochNav.allTime));
    expect(onShowFullTimeline).toHaveBeenCalledTimes(1);
  });

  it('"Ganzen Zeitstrahl" and "Eigener Filter" are the last two tiles under Erkunden', async () => {
    const { getAllByRole } = await setup();
    const labels = getAllByRole('button').map((b) => b.props.accessibilityLabel as string);
    const lastTwo = labels.slice(-2);
    expect(lastTwo).toEqual([de.epochNav.allTime, de.filterSheet.setOwnFilters]);
  });

  it('re-sorts journeys/themes when the app language changes', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    try {
      const { getByLabelText } = await setup();
      await fireEvent.press(getByLabelText(en.themeSection.title));
      expect(getByLabelText(en.theme.kolonialismus.label)).toBeTruthy();
    } finally {
      await act(async () => {
        await i18n.changeLanguage('de');
      });
    }
  });
});
