import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { CultureFilterModal } from '../CultureFilterModal';

function setup(overrides?: { cultures?: string[]; active?: string | null; visible?: boolean }) {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <CultureFilterModal
      visible={overrides?.visible ?? true}
      continent="europa"
      cultures={overrides?.cultures ?? ['griechisch', 'römisch']}
      active={overrides?.active ?? null}
      onSelect={onSelect}
      onClose={onClose}
    />,
  );
  return { ...utils, onSelect, onClose };
}

describe('CultureFilterModal (#163)', () => {
  it('renders "Alle anzeigen" plus one row per culture', () => {
    const { getByText } = setup();
    expect(getByText('Alle anzeigen')).toBeTruthy();
    expect(getByText('griechisch')).toBeTruthy();
    expect(getByText('römisch')).toBeTruthy();
  });

  it('selecting a culture calls onSelect with that culture and closes', () => {
    const { getByText, onSelect, onClose } = setup();
    fireEvent.press(getByText('römisch'));
    expect(onSelect).toHaveBeenCalledWith('römisch');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selecting "Alle anzeigen" clears the filter', () => {
    const { getByText, onSelect } = setup({ active: 'römisch' });
    fireEvent.press(getByText('Alle anzeigen'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('shows a hint when no cultures are available', () => {
    const { getByText } = setup({ cultures: [] });
    expect(getByText('Keine Kulturen für diesen Kontinent verfügbar')).toBeTruthy();
  });
});
