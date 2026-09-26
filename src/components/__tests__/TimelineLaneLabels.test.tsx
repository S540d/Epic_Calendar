import React from 'react';
import { render } from '@testing-library/react-native';
import '@/i18n';
import type { Category } from '@/theme/tokens';
import { TimelineLaneLabels } from '../TimelineLaneLabels';

const lanes: Category[] = ['erdzeitalter', 'zivilisation'];

async function renderLabels(overflow: [Category, number][] = []) {
  return render(
    <TimelineLaneLabels
      lanes={lanes}
      laneTops={[0, 120]}
      laneTrackCounts={
        new Map<Category, number>([
          ['erdzeitalter', 2],
          ['zivilisation', 3],
        ])
      }
      overflowCounts={new Map<Category, number>(overflow)}
    />,
  );
}

describe('TimelineLaneLabels', () => {
  it('renders a translated label per lane', async () => {
    const { getByText } = await renderLabels();
    expect(getByText('Erdzeitalter')).toBeTruthy();
    expect(getByText('Zivilisationen')).toBeTruthy();
  });

  it('shows a cluster badge only for lanes that overflow', async () => {
    const { getByText, queryByText } = await renderLabels([['zivilisation', 7]]);
    expect(getByText('+7')).toBeTruthy();
    // erdzeitalter has no overflow entry → no badge at all.
    expect(queryByText('+0')).toBeNull();
  });

  it('renders no badge when nothing overflows', async () => {
    const { queryByText } = await renderLabels();
    expect(queryByText(/^\+\d+$/)).toBeNull();
  });
});
