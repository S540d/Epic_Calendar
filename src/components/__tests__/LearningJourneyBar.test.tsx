import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { LearningJourneyBar } from '../LearningJourneyBar';
import type { TimelineEvent } from '@/data/schema';

const EVENT: TimelineEvent = {
  id: 'archimedes-tod',
  title: 'Der Tod des Archimedes',
  description: 'Ein römischer Soldat tötet Archimedes bei der Eroberung von Syrakus.',
  startYear: -212,
  category: 'natur',
  continent: 'global',
  minZoomLevel: 2,
  story: 'Störe meine Kreise nicht!',
};

async function setup(overrides?: Partial<React.ComponentProps<typeof LearningJourneyBar>>) {
  const onPrev = jest.fn();
  const onNext = jest.fn();
  const onExit = jest.fn();
  const utils = await render(
    <LearningJourneyBar
      journeyLabelKey="learning.journey.beruehmte-geschichten.label"
      event={EVENT}
      stepIndex={1}
      stepCount={5}
      onPrev={onPrev}
      onNext={onNext}
      onExit={onExit}
      {...overrides}
    />,
  );
  return { ...utils, onPrev, onNext, onExit };
}

describe('LearningJourneyBar (Lernreise)', () => {
  it('shows the journey name, progress and the current station content', async () => {
    const { getByText } = await setup();
    expect(getByText('Berühmte Geschichten')).toBeTruthy();
    expect(getByText('Station 2 von 5')).toBeTruthy();
    expect(getByText('Der Tod des Archimedes')).toBeTruthy();
    expect(getByText('Störe meine Kreise nicht!')).toBeTruthy();
  });

  it('wires the navigation buttons to their own callbacks', async () => {
    const { getByLabelText, onPrev, onNext, onExit } = await setup();

    await fireEvent.press(getByLabelText('Weiter'));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();

    await fireEvent.press(getByLabelText('Zurück'));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('disables "Zurück" on the first station', async () => {
    const { getByLabelText, onPrev } = await setup({ stepIndex: 0 });
    await fireEvent.press(getByLabelText('Zurück'));
    expect(onPrev).not.toHaveBeenCalled();
  });

  // The last station must end the journey rather than run past the end of the list.
  it('turns the primary button into "Reise abschließen" on the last station', async () => {
    const { getByLabelText, onNext, onExit } = await setup({ stepIndex: 4, stepCount: 5 });
    await fireEvent.press(getByLabelText('Reise abschließen'));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('renders without content when the station has no resolvable event', async () => {
    const { queryByText, getByLabelText } = await setup({ event: null });
    expect(queryByText('Der Tod des Archimedes')).toBeNull();
    expect(getByLabelText('Weiter')).toBeTruthy();
  });

  it('exits via the close button', async () => {
    const { getByLabelText, onExit } = await setup();
    await fireEvent.press(getByLabelText('Reise beenden'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
