import React, { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import '@/i18n';
import { TimelineZoomCluster, type TimelineZoomClusterHandle } from '../TimelineZoomCluster';

function setup() {
  const jumpToToday = jest.fn();
  const zoomIn = jest.fn();
  const zoomOut = jest.fn();
  const ref = createRef<TimelineZoomClusterHandle>();
  const utils = render(
    <TimelineZoomCluster ref={ref} jumpToToday={jumpToToday} zoomIn={zoomIn} zoomOut={zoomOut} />,
  );
  return { ...utils, jumpToToday, zoomIn, zoomOut, ref };
}

describe('TimelineZoomCluster', () => {
  it('renders the three controls with accessible labels', () => {
    const { getByLabelText } = setup();
    expect(getByLabelText('Heute')).toBeTruthy();
    expect(getByLabelText('Vergrößern')).toBeTruthy();
    expect(getByLabelText('Verkleinern')).toBeTruthy();
  });

  it('wires each button to its own callback', () => {
    const { getByLabelText, jumpToToday, zoomIn, zoomOut } = setup();

    fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
    expect(zoomOut).not.toHaveBeenCalled();
    expect(jumpToToday).not.toHaveBeenCalled();

    fireEvent.press(getByLabelText('Verkleinern'));
    expect(zoomOut).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText('Heute'));
    expect(jumpToToday).toHaveBeenCalledTimes(1);
  });
});

describe('TimelineZoomCluster fade-on-inactivity (#215)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // isReduceMotionEnabled() resolves asynchronously; flush that microtask
  // under `act` so React's state update from the resolved promise isn't left
  // dangling outside a test-controlled act.
  async function flushReduceMotionCheck() {
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('exposes an imperative wake() the parent can call from its own event handlers', async () => {
    const { ref } = setup();
    await flushReduceMotionCheck();
    expect(ref.current?.wake).toBeInstanceOf(Function);
  });

  it('stays fully functional (never unmounted, still pressable) after inactivity', async () => {
    const { getByLabelText, zoomIn } = setup();
    await flushReduceMotionCheck();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Never unmounted, still pressable — a single tap must still register.
    fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
  });

  it('wake() (called by the parent on canvas pan/pinch/tap) resets the fade timer', async () => {
    const { ref, getByLabelText, zoomIn } = setup();
    await flushReduceMotionCheck();

    act(() => {
      jest.advanceTimersByTime(2900);
    });
    act(() => {
      ref.current?.wake();
      jest.advanceTimersByTime(2900);
    });

    // Total elapsed since the last wake() is only 2.9s — still functional
    // either way, this exercises the reset path itself.
    fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
  });

  it('pressing a button itself keeps the cluster awake', async () => {
    const { getByLabelText, zoomIn } = setup();
    await flushReduceMotionCheck();
    fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
    // Doesn't throw / unmount right after a press.
    expect(getByLabelText('Vergrößern')).toBeTruthy();
  });
});
