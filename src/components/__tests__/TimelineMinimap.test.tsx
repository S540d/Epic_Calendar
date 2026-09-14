import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { TimelineMinimap } from '../TimelineMinimap';

describe('TimelineMinimap (#214)', () => {
  it('tap-to-jump still works despite the thinner visual hairline', () => {
    const onJump = jest.fn();
    const { getByLabelText } = render(
      <TimelineMinimap offsetX={0} pixelsPerUnit={1} canvasWidth={800} onJump={onJump} />,
    );
    const track = getByLabelText('Zeitstrahl-Übersicht');
    fireEvent(track, 'layout', { nativeEvent: { layout: { width: 400 } } });
    fireEvent.press(track, { nativeEvent: { locationX: 200 } });
    expect(onJump).toHaveBeenCalledTimes(1);
  });

  it('keeps a touch-friendly hit area via hitSlop', () => {
    const { getByLabelText } = render(
      <TimelineMinimap offsetX={0} pixelsPerUnit={1} canvasWidth={800} onJump={jest.fn()} />,
    );
    const track = getByLabelText('Zeitstrahl-Übersicht');
    expect(track.props.hitSlop).toEqual({ top: 10, bottom: 10 });
  });

  it('a11y increment/decrement actions remain functional', () => {
    const onJump = jest.fn();
    const { getByLabelText } = render(
      <TimelineMinimap offsetX={0} pixelsPerUnit={1} canvasWidth={800} onJump={onJump} />,
    );
    const track = getByLabelText('Zeitstrahl-Übersicht');
    fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onJump).toHaveBeenCalledTimes(1);
  });
});
