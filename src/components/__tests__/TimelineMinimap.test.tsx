import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { TimelineMinimap } from '../TimelineMinimap';

/** Viewport over the Middle Ages: 900 years on an 800px canvas. */
const VIEW = { offsetX: 600, pixelsPerUnit: 800 / 900, canvasWidth: 800 };
const BAR_WIDTH = 800;

async function renderMinimap(props: Partial<React.ComponentProps<typeof TimelineMinimap>> = {}) {
  const onJump = jest.fn();
  const onZoomTo = jest.fn();
  const utils = await render(
    <TimelineMinimap {...VIEW} onJump={onJump} onZoomTo={onZoomTo} {...props} />,
  );
  const track = utils.getByLabelText('Zeitstrahl-Übersicht');
  await fireEvent(track, 'layout', { nativeEvent: { layout: { width: BAR_WIDTH } } });
  return { ...utils, track, onJump, onZoomTo };
}

const touch = (locationX: number) => ({ nativeEvent: { locationX } });

describe('TimelineMinimap (overview strip)', () => {
  it('shows the viewport as a clearly visible box, not a stub at the edge', async () => {
    const { getByTestId } = await renderMinimap();
    const style = Object.assign({}, ...[getByTestId('minimap-viewport-box').props.style].flat());
    // 900 years of a ~10 000-year window ≈ 1/10 of the track.
    expect(style.width).toBeGreaterThan(BAR_WIDTH / 20);
    expect(style.width).toBeLessThan(BAR_WIDTH / 4);
    expect(style.left + style.width).toBeLessThan(BAR_WIDTH);
  });

  it('paints the surrounding epochs', async () => {
    const { getAllByText } = await renderMinimap();
    expect(getAllByText('Mittelalter').length).toBeGreaterThan(0);
  });

  it('tap outside the box centres the viewport there (animated)', async () => {
    const { track, onJump } = await renderMinimap();
    await fireEvent(track, 'responderGrant', touch(5));
    expect(onJump).toHaveBeenCalledTimes(1);
    const [offset, animate] = onJump.mock.calls[0];
    expect(offset).toBeLessThan(VIEW.offsetX);
    expect(animate).toBe(true);
  });

  it('dragging scrubs without animation and keeps the grab point', async () => {
    const { track, onJump, getByTestId } = await renderMinimap();
    const style = Object.assign({}, ...[getByTestId('minimap-viewport-box').props.style].flat());
    const onBox = style.left + style.width / 2;
    await fireEvent(track, 'responderGrant', touch(onBox));
    expect(onJump).not.toHaveBeenCalled();
    await fireEvent(track, 'responderMove', touch(onBox + 20));
    expect(onJump).toHaveBeenCalledTimes(1);
    const [offset, animate] = onJump.mock.calls[0];
    expect(animate).toBe(false);
    expect(offset).toBeGreaterThan(VIEW.offsetX);
    await fireEvent(track, 'responderRelease', touch(onBox + 20));
  });

  it('crumbs show where the viewport is, not what the window mostly covers', async () => {
    const { getByLabelText, queryByLabelText } = await renderMinimap();
    expect(getByLabelText('Mittelalter')).toBeTruthy();
    expect(queryByLabelText('Frühe Hochkulturen')).toBeNull();
  });

  it('context crumbs zoom to their epoch', async () => {
    const { getByLabelText, onZoomTo } = await renderMinimap();
    await fireEvent.press(getByLabelText('Menschheitsgeschichte'));
    expect(onZoomTo).toHaveBeenCalledWith(-2_580_000, 2026);
  });

  it('a11y increment/decrement actions remain functional', async () => {
    const { track, onJump } = await renderMinimap();
    await fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onJump).toHaveBeenCalledTimes(1);
    expect(onJump.mock.calls[0][0]).toBeGreaterThan(VIEW.offsetX);
  });
});
