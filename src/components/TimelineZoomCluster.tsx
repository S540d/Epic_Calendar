import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, LayoutAnimation, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { timelineStyles as styles } from './timelineRenderShared';

type Props = {
  jumpToToday: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export type TimelineZoomClusterHandle = {
  /** Cancels the inactivity fade and restarts its timer — called by the
   *  parent from its own event handlers (canvas pan/pinch/tap) via ref,
   *  rather than through a prop + effect, which would call `setState`
   *  synchronously inside an effect and risk a cascading render. */
  wake: () => void;
};

const INACTIVITY_MS = 3000;

/**
 * Floating zoom controls pinned to the bottom-right of the canvas:
 * jump-to-today, zoom in, zoom out.
 *
 * Shared by both renderers. `styles.zoomButtons` already carries the absolute
 * positioning, so no platform-specific override is needed — the web renderer
 * previously repeated `position/right/bottom` through a `Platform.select` that
 * set exactly the values the base style already had.
 *
 * #215 (follow-up of #211): rather than removing +/− (the only zoom path that
 * works with a plain mouse, and the only one that's screen-reader focusable),
 * the cluster dims to ~35% opacity after 3s of inactivity and brightens again
 * on interaction. It never unmounts and keeps `pointerEvents` active while
 * dimmed, so a single tap still hits it — a second "wake up" tap would trade
 * one problem (visual clutter) for another (a dead first tap).
 */
export const TimelineZoomCluster = forwardRef<TimelineZoomClusterHandle, Props>(
  function TimelineZoomCluster({ jumpToToday, zoomIn, zoomOut }, ref) {
    const { t } = useTranslation();
    const [faded, setFaded] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoveredRef = useRef(false);

    useEffect(() => {
      AccessibilityInfo.isReduceMotionEnabled()
        .then(setReduceMotion)
        .catch(() => {});
      const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
      return () => sub.remove();
    }, []);

    const applyFaded = useCallback(
      (next: boolean) => {
        if (Platform.OS !== 'web' && !reduceMotion) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setFaded(next);
      },
      [reduceMotion],
    );

    const scheduleFade = useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!hoveredRef.current) applyFaded(true);
      }, INACTIVITY_MS);
    }, [applyFaded]);

    const wake = useCallback(() => {
      applyFaded(false);
      scheduleFade();
    }, [applyFaded, scheduleFade]);

    useImperativeHandle(ref, () => ({ wake }), [wake]);

    // Starts the fade timer on mount (no setState here — only `applyFaded`,
    // called later from the timeout callback, ever does that).
    useEffect(() => {
      scheduleFade();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [scheduleFade]);

    // Wheel scroll/zoom never reaches the parent's touch-responder capture
    // (there's no touch), so it's handled here directly on web.
    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const handler = () => wake();
      window.addEventListener('wheel', handler, { passive: true, capture: true });
      return () => window.removeEventListener('wheel', handler, true);
    }, [wake]);

    const handleMouseEnter = useCallback(() => {
      hoveredRef.current = true;
      wake();
    }, [wake]);
    const handleMouseLeave = useCallback(() => {
      hoveredRef.current = false;
      scheduleFade();
    }, [scheduleFade]);

    const webHoverProps =
      Platform.OS === 'web'
        ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
        : null;

    const handleJumpToToday = useCallback(() => {
      wake();
      jumpToToday();
    }, [wake, jumpToToday]);
    const handleZoomIn = useCallback(() => {
      wake();
      zoomIn();
    }, [wake, zoomIn]);
    const handleZoomOut = useCallback(() => {
      wake();
      zoomOut();
    }, [wake, zoomOut]);

    return (
      <View
        style={[styles.zoomButtons, faded && styles.zoomButtonsFaded]}
        pointerEvents="box-none"
        {...webHoverProps}
      >
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={handleJumpToToday}
          accessibilityLabel={t('axis.today')}
        >
          <Text style={styles.zoomBtnText}>⌖</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={handleZoomIn}
          accessibilityLabel={t('zoomCluster.zoomIn')}
        >
          <Text style={styles.zoomBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={handleZoomOut}
          accessibilityLabel={t('zoomCluster.zoomOut')}
        >
          <Text style={styles.zoomBtnText}>−</Text>
        </TouchableOpacity>
      </View>
    );
  },
);
