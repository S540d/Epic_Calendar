import { StyleSheet } from 'react-native';
import { yearToT } from '@/timeline/scale';
import type { TimelineEvent } from '@/data/schema';
import type { Category } from '@/theme/tokens';
import type { TrackMap } from '@/timeline/culling';
import {
  LANE_LABEL_WIDTH,
  LANE_PADDING_V,
  TRACK_HEIGHT,
  colors,
  shadows,
  spacing,
  typography,
} from '@/theme/tokens';

/** Minimum visible bar width to attempt rendering a (possibly truncated) label. */
export const LABEL_MIN_BAR_PX = 22;
export const LABEL_MAX_WIDTH = 96;
export const POPOVER_MAX_WIDTH = 220;
export const POPOVER_MAX_HEIGHT = 200;

/** Minimum touch-target size (iOS HIG 44pt / Material 48dp) for event taps. */
export const MIN_HIT_PX = 44;
/** Maximum events rendered per lane; excess shows a "+N" cluster badge. */
export const MAX_EVENTS_PER_LANE = 15;
/** Zoom factor applied per double-tap / two-finger-tap. */
export const TAP_ZOOM_FACTOR = 1.8;
/** Duration of the zoom-to-fit pan/scale animation on native. */
export const ZOOM_TO_FIT_DURATION_MS = 600;

/** Returns the pixel height of a lane with the given number of tracks. */
export function laneHeightForTracks(n: number): number {
  return n * TRACK_HEIGHT + LANE_PADDING_V * 2;
}

/**
 * Collision-aware label visibility: checks collisions per track so events
 * in different tracks never suppress each other. Largest bars win.
 */
export function computeLabelVisibleIds(
  visibleByLane: Map<Category, TimelineEvent[]>,
  tracksByLane: Map<Category, TrackMap>,
  jsOffsetX: number,
  jsPixelsPerUnit: number,
  canvasWidth: number,
): Set<string> {
  const result = new Set<string>();
  for (const [cat, events] of visibleByLane.entries()) {
    const trackMap = tracksByLane.get(cat);
    // Group events by track
    const byTrack = new Map<number, TimelineEvent[]>();
    for (const ev of events) {
      const t = trackMap?.get(ev.id);
      if (t === undefined) continue; // event beyond MAX_EVENTS_PER_LANE cap — no bar rendered
      if (!byTrack.has(t)) byTrack.set(t, []);
      byTrack.get(t)!.push(ev);
    }
    for (const trackEvents of byTrack.values()) {
      const placed: Array<{ l: number; r: number }> = [];
      const sorted = [...trackEvents].sort((a, b) => {
        const wa = (yearToT(a.endYear ?? a.startYear) - yearToT(a.startYear)) * jsPixelsPerUnit;
        const wb = (yearToT(b.endYear ?? b.startYear) - yearToT(b.startYear)) * jsPixelsPerUnit;
        return wb - wa;
      });
      for (const ev of sorted) {
        const x = (yearToT(ev.startYear) - jsOffsetX) * jsPixelsPerUnit;
        const w = Math.max(
          0,
          (yearToT(ev.endYear ?? ev.startYear) - yearToT(ev.startYear)) * jsPixelsPerUnit,
        );
        if (w < LABEL_MIN_BAR_PX) continue;
        const visibleLeft = Math.max(x, 0);
        const visibleRight = Math.min(x + w, canvasWidth);
        if (visibleRight - visibleLeft < 6) continue;
        const lx = visibleLeft + 3;
        const rx = lx + Math.min(LABEL_MAX_WIDTH, visibleRight - visibleLeft - 6);
        if (placed.some((p) => lx < p.r && rx > p.l)) continue;
        placed.push({ l: lx, r: rx });
        result.add(ev.id);
      }
    }
  }
  return result;
}

/** Shared styles for both timeline renderers (web + native). */
export const timelineStyles = StyleSheet.create({
  axisRow: {
    flexDirection: 'row',
  },
  container: {
    flexDirection: 'row',
  },
  labels: {
    width: LANE_LABEL_WIDTH,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    justifyContent: 'center',
  },
  labelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  clusterBadge: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  zoomButtons: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'column',
    gap: 6,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(31, 36, 45, 0.90)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  popover: {
    position: 'absolute',
    minWidth: 160,
    maxWidth: POPOVER_MAX_WIDTH,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    zIndex: 100,
    ...shadows.md,
  },
  popoverTitle: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    gap: 8,
  },
  popoverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  popoverText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  popoverDismiss: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  popoverDismissText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
