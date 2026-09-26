import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { LearningJourneysScreen } from '../LearningJourneysScreen';
import { LEARNING_JOURNEYS } from '@/data/learningJourneys';
import de from '@/i18n/de.json';

async function setup() {
  const onBack = jest.fn();
  const onStartJourney = jest.fn();
  const utils = await render(
    <LearningJourneysScreen onBack={onBack} onStartJourney={onStartJourney} journeyProgress={{}} />,
  );
  return { ...utils, onBack, onStartJourney };
}

describe('LearningJourneysScreen (#239, moved from EpochOverviewScreen)', () => {
  it('renders a card per curated journey', async () => {
    const { getByLabelText } = await setup();
    for (const journey of LEARNING_JOURNEYS) {
      expect(
        getByLabelText(de.learning.journey[journey.id as keyof typeof de.learning.journey].label),
      ).toBeTruthy();
    }
  });

  it('tapping a journey card calls onStartJourney with its id', async () => {
    const journey = LEARNING_JOURNEYS[0]!;
    const label = de.learning.journey[journey.id as keyof typeof de.learning.journey].label;
    const { getByLabelText, onStartJourney } = await setup();
    await fireEvent.press(getByLabelText(label));
    expect(onStartJourney).toHaveBeenCalledWith(journey.id);
  });

  it('tapping the back button calls onBack', async () => {
    const { getByLabelText, onBack } = await setup();
    await fireEvent.press(getByLabelText(de.nav.back));
    expect(onBack).toHaveBeenCalled();
  });
});
