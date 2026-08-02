import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { TimelineZoomCluster } from '../TimelineZoomCluster';

function setup() {
  const jumpToToday = jest.fn();
  const zoomIn = jest.fn();
  const zoomOut = jest.fn();
  const utils = render(
    <TimelineZoomCluster jumpToToday={jumpToToday} zoomIn={zoomIn} zoomOut={zoomOut} />,
  );
  return { ...utils, jumpToToday, zoomIn, zoomOut };
}

describe('TimelineZoomCluster', () => {
  it('renders the three controls with accessible labels', () => {
    const { getByLabelText } = setup();
    expect(getByLabelText('Heute')).toBeTruthy();
    expect(getByLabelText('Zoom in')).toBeTruthy();
    expect(getByLabelText('Zoom out')).toBeTruthy();
  });

  it('wires each button to its own callback', () => {
    const { getByLabelText, jumpToToday, zoomIn, zoomOut } = setup();

    fireEvent.press(getByLabelText('Zoom in'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
    expect(zoomOut).not.toHaveBeenCalled();
    expect(jumpToToday).not.toHaveBeenCalled();

    fireEvent.press(getByLabelText('Zoom out'));
    expect(zoomOut).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText('Heute'));
    expect(jumpToToday).toHaveBeenCalledTimes(1);
  });
});
