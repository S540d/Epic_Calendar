import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { TimelineChrome } from '../TimelineChrome';

/**
 * Viewport covering roughly the Hellenistic period, so the breadcrumb resolves
 * to a full three-level path (Menschheit › Antike › Hellenismus).
 */
const HELLENISM = { startYear: -320, endYear: -280 };

function renderChrome(overrides: Partial<React.ComponentProps<typeof TimelineChrome>> = {}) {
  const zoomToFit = jest.fn();
  const handleMinimapJump = jest.fn();
  const span = overrides.viewportRange ?? HELLENISM;
  const canvasWidth = 800;
  const utils = render(
    <TimelineChrome
      jsOffsetX={span.startYear}
      jsPixelsPerUnit={canvasWidth / (span.endYear - span.startYear)}
      canvasWidth={canvasWidth}
      zoomLevel={4}
      viewportRange={span}
      zoomToFit={zoomToFit}
      handleMinimapJump={handleMinimapJump}
      {...overrides}
    />,
  );
  return { ...utils, zoomToFit, handleMinimapJump };
}

describe('TimelineChrome', () => {
  it('renders the whole header stack: zoom band, breadcrumb path and minimap', () => {
    const { getByText, getByLabelText, getAllByLabelText } = renderChrome();

    // Zoom pill (absorbed from the former ZoomLevelIndicator).
    expect(getByText('Jahre')).toBeTruthy();
    // Breadcrumb crumbs for the current viewport. "Hellenismus" appears twice —
    // once as a crumb, once as an epoch-band segment (see the band test below).
    expect(getByLabelText('Menschheitsgeschichte')).toBeTruthy();
    expect(getByLabelText('Antike')).toBeTruthy();
    expect(getAllByLabelText('Hellenismus').length).toBeGreaterThan(0);
    // Minimap is part of the stack.
    expect(getByLabelText(/Zeitstrahl/i)).toBeTruthy();
  });

  it('zooms to the tapped crumb rather than the current viewport', () => {
    const { getByLabelText, zoomToFit } = renderChrome();

    fireEvent.press(getByLabelText('Antike'));

    expect(zoomToFit).toHaveBeenCalledTimes(1);
    expect(zoomToFit).toHaveBeenCalledWith(-800, 600);
  });

  it('coarsens the breadcrumb when zoomed all the way out', () => {
    const { queryByLabelText } = renderChrome({
      viewportRange: { startYear: -13_800_000_000, endYear: 2026 },
      zoomLevel: 0,
    });

    // The coverage guard must stop the path from claiming a narrow sub-epoch.
    expect(queryByLabelText('Hellenismus')).toBeNull();
    expect(queryByLabelText('Antike')).toBeNull();
  });

  it('hides the FPS pill unless explicitly enabled', () => {
    const { queryByText } = renderChrome();
    expect(queryByText(/FPS$/)).toBeNull();
  });

  it('renders epoch band segments for the visible range', () => {
    // At this span the band renders its finest level, so the sub-epochs of
    // antiquity must appear as tappable segments alongside the crumbs.
    const { getAllByLabelText } = renderChrome();
    expect(getAllByLabelText('Hellenismus').length).toBeGreaterThanOrEqual(2);
  });
});
