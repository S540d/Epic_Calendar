import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { TimelineChrome } from '../TimelineChrome';

/**
 * Viewport covering roughly the Hellenistic period, so the epoch band renders
 * its finest level (Hellenismus etc.) while the ancestor prefix chip in
 * `EpochBand` carries the levels above it (Menschheitsgeschichte › Antike ›).
 */
const HELLENISM = { startYear: -320, endYear: -280 };

function renderChrome(overrides: Partial<React.ComponentProps<typeof TimelineChrome>> = {}) {
  const zoomToFit = jest.fn();
  const handleMinimapJump = jest.fn();
  const span = HELLENISM;
  const canvasWidth = 800;
  const utils = render(
    <TimelineChrome
      jsOffsetX={span.startYear}
      jsPixelsPerUnit={canvasWidth / (span.endYear - span.startYear)}
      canvasWidth={canvasWidth}
      zoomLevel={4}
      zoomToFit={zoomToFit}
      handleMinimapJump={handleMinimapJump}
      {...overrides}
    />,
  );
  return { ...utils, zoomToFit, handleMinimapJump };
}

describe('TimelineChrome (#213)', () => {
  it('renders the header stack: minimap, epoch band and its ancestor prefix', () => {
    const { getByLabelText, getAllByLabelText } = renderChrome();

    // Ancestor prefix chip on EpochBand (levels above what the band itself shows).
    expect(getByLabelText('Menschheitsgeschichte')).toBeTruthy();
    expect(getByLabelText('Antike')).toBeTruthy();
    // The band's own segment for the current level.
    expect(getAllByLabelText('Hellenismus').length).toBeGreaterThan(0);
    // Minimap is part of the stack.
    expect(getByLabelText(/Zeitstrahl/i)).toBeTruthy();
  });

  it('there is no separate breadcrumb row with a zoom-level pill', () => {
    const { queryByText } = renderChrome();
    // Former internal LOD naming ("Jahre" for zoomLevel 4) must not leak into the UI.
    expect(queryByText('Jahre')).toBeNull();
  });

  it('zooms to the tapped ancestor rather than the current viewport', () => {
    const { getByLabelText, zoomToFit } = renderChrome();

    fireEvent.press(getByLabelText('Antike'));

    expect(zoomToFit).toHaveBeenCalledTimes(1);
    expect(zoomToFit).toHaveBeenCalledWith(-800, 600);
  });

  it('shows no ancestor prefix when zoomed all the way out', () => {
    const { queryByLabelText } = renderChrome({
      jsOffsetX: -13_800_000_000,
      jsPixelsPerUnit: 800 / (2026 - -13_800_000_000),
    });

    // The coverage guard must stop the path from claiming a narrow sub-epoch,
    // and the band itself renders only its coarsest level here.
    expect(queryByLabelText('Hellenismus')).toBeNull();
    expect(queryByLabelText('Antike')).toBeNull();
  });

  it('hides the FPS pill unless explicitly enabled', () => {
    const { queryByText } = renderChrome();
    expect(queryByText(/FPS$/)).toBeNull();
  });
});
