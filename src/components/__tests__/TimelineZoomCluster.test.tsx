import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { TimelineZoomCluster, type TimelineZoomClusterHandle } from '../TimelineZoomCluster';

async function setup() {
  const jumpToToday = jest.fn();
  const zoomIn = jest.fn();
  const zoomOut = jest.fn();
  const ref = createRef<TimelineZoomClusterHandle>();
  const utils = await render(
    <TimelineZoomCluster ref={ref} jumpToToday={jumpToToday} zoomIn={zoomIn} zoomOut={zoomOut} />,
  );
  return { ...utils, jumpToToday, zoomIn, zoomOut, ref };
}

describe('TimelineZoomCluster', () => {
  it('renders the three controls with accessible labels', async () => {
    const { getByLabelText } = await setup();
    expect(getByLabelText('Heute')).toBeTruthy();
    expect(getByLabelText('Vergrößern')).toBeTruthy();
    expect(getByLabelText('Verkleinern')).toBeTruthy();
  });

  it('wires each button to its own callback', async () => {
    const { getByLabelText, jumpToToday, zoomIn, zoomOut } = await setup();

    await fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
    expect(zoomOut).not.toHaveBeenCalled();
    expect(jumpToToday).not.toHaveBeenCalled();

    await fireEvent.press(getByLabelText('Verkleinern'));
    expect(zoomOut).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByLabelText('Heute'));
    expect(jumpToToday).toHaveBeenCalledTimes(1);
  });
});
