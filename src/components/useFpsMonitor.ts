import { useEffect, useState } from 'react';
import { useFrameCallback, useSharedValue, runOnJS } from 'react-native-reanimated';

/** Frame samples are aggregated into a rolling FPS reading every 500ms. */
const SAMPLE_WINDOW_MS = 500;

/**
 * Measures the on-screen frame rate via Reanimated's UI-thread frame callback
 * (#5 FPS-Monitoring). Returns 0 while disabled or before the first sample window
 * completes.
 */
export function useFpsMonitor(enabled: boolean): number {
  const [fps, setFps] = useState(0);
  const frameCount = useSharedValue(0);
  const windowStartMs = useSharedValue(0);

  const frameCallback = useFrameCallback((frameInfo) => {
    const now = frameInfo.timestamp;
    if (windowStartMs.value === 0) {
      windowStartMs.value = now;
    }
    frameCount.value += 1;
    const elapsed = now - windowStartMs.value;
    if (elapsed >= SAMPLE_WINDOW_MS) {
      const currentFps = Math.round((frameCount.value * 1000) / elapsed);
      runOnJS(setFps)(currentFps);
      frameCount.value = 0;
      windowStartMs.value = now;
    }
  }, false);

  useEffect(() => {
    if (enabled) {
      frameCount.value = 0;
      windowStartMs.value = 0;
    }
    frameCallback.setActive(enabled);
    // frameCallback is a stable handle from useFrameCallback; frameCount/windowStartMs
    // are stable shared-value refs. Only `enabled` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Derived rather than reset via setState-in-effect: stale reading from a
  // previous session never surfaces since it only renders while enabled.
  return enabled ? fps : 0;
}
