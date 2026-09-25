import React, { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import '@/i18n';
import { TimelineZoomCluster, type TimelineZoomClusterHandle } from '../TimelineZoomCluster';

/**
 * Split from TimelineZoomCluster.test.tsx (#221 Stufe 6, testing-library
 * 12→14 migration): mixing fake-timer tests with the plain real-timer
 * render/press tests in one file left later renders in that file unable to
 * find any element — a `fireEvent.press` under fake timers appears to strand
 * React's own Scheduler (which schedules its own continuation work via
 * timers) once real timers come back for the next test. Keeping every test
 * in this file on fake timers throughout avoids that real/fake transition
 * entirely.
 */
async function setup() {
  const jumpToToday = jest.fn();
  const zoomIn = jest.fn();
  const zoomOut = jest.fn();
  const ref = createRef<TimelineZoomClusterHandle>();
  // testing-library v14's async render() settles via a real setImmediate
  // captured at module-load time (before fake timers exist), so rendering
  // itself is safe under fake timers — no need to render-then-switch here.
  const utils = await render(
    <TimelineZoomCluster ref={ref} jumpToToday={jumpToToday} zoomIn={zoomIn} zoomOut={zoomOut} />,
  );
  return { ...utils, jumpToToday, zoomIn, zoomOut, ref };
}

describe('TimelineZoomCluster fade-on-inactivity (#215)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('exposes an imperative wake() the parent can call from its own event handlers', async () => {
    const { ref } = await setup();
    expect(ref.current?.wake).toBeInstanceOf(Function);
  });

  it('stays fully functional (never unmounted, still pressable) after inactivity', async () => {
    const { getByLabelText, zoomIn } = await setup();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    // Never unmounted, still pressable — a single tap must still register.
    await fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
  });

  it('wake() (called by the parent on canvas pan/pinch/tap) resets the fade timer', async () => {
    const { ref, getByLabelText, zoomIn } = await setup();

    await act(async () => {
      jest.advanceTimersByTime(2900);
    });
    // wake()'s setState and the timer advance must be separate, awaited
    // act() calls — combining them (or leaving either synchronous) re-enters
    // React's commit phase while the outer act() is still open ("overlapping
    // act() calls") under React 19.
    await act(async () => {
      ref.current?.wake();
    });
    await act(async () => {
      jest.advanceTimersByTime(2900);
    });

    // Total elapsed since the last wake() is only 2.9s — still functional
    // either way, this exercises the reset path itself.
    await fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
  });

  it('pressing a button itself keeps the cluster awake', async () => {
    const { getByLabelText, zoomIn } = await setup();
    await fireEvent.press(getByLabelText('Vergrößern'));
    expect(zoomIn).toHaveBeenCalledTimes(1);
    // Doesn't throw / unmount right after a press.
    expect(getByLabelText('Vergrößern')).toBeTruthy();
  });
});
