import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { ContinentTabBar } from '../ContinentTabBar';

describe('ContinentTabBar (#163 culture filter wiring)', () => {
  it('pressing an inactive tab calls onChange, not onPressActive', async () => {
    const onChange = jest.fn();
    const onPressActive = jest.fn();
    const { getByLabelText } = await render(
      <ContinentTabBar active="europa" onChange={onChange} onPressActive={onPressActive} />,
    );
    await fireEvent.press(getByLabelText('Asien'));
    expect(onChange).toHaveBeenCalledWith('asien');
    expect(onPressActive).not.toHaveBeenCalled();
  });

  it('pressing the already-active tab calls onPressActive, not onChange', async () => {
    const onChange = jest.fn();
    const onPressActive = jest.fn();
    const { getByLabelText } = await render(
      <ContinentTabBar active="europa" onChange={onChange} onPressActive={onPressActive} />,
    );
    await fireEvent.press(getByLabelText(/Europa/));
    expect(onPressActive).toHaveBeenCalledWith('europa');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the active tab as filtered in its accessibility label when cultureFilterActive is set', async () => {
    const { getByLabelText } = await render(
      <ContinentTabBar active="europa" onChange={jest.fn()} cultureFilterActive />,
    );
    expect(getByLabelText(/Europa, gefiltert/)).toBeTruthy();
  });

  it('renders an enabled "Alle" tab that selects all continents at once', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <ContinentTabBar active="europa" onChange={onChange} onPressActive={jest.fn()} />,
    );
    await fireEvent.press(getByLabelText('Alle'));
    expect(onChange).toHaveBeenCalledWith('all');
  });
});
