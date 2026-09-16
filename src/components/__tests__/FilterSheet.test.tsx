import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n';
import { FilterSheet } from '../FilterSheet';
import { DEFAULT_CATEGORIES } from '@/theme/categories';
import type { Category } from '@/theme/tokens';

function setup(overrides?: {
  cultures?: string[];
  activeCulture?: string | null;
  activeCategories?: Category[];
  activeTheme?: string | null;
}) {
  const onToggleCategory = jest.fn();
  const onSelectCulture = jest.fn();
  const onSelectTheme = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <FilterSheet
      visible
      onClose={onClose}
      activeCategories={new Set(overrides?.activeCategories ?? DEFAULT_CATEGORIES)}
      onToggleCategory={onToggleCategory}
      continent="europa"
      cultures={overrides?.cultures ?? ['griechisch', 'römisch']}
      activeCulture={overrides?.activeCulture ?? null}
      onSelectCulture={onSelectCulture}
      activeTheme={overrides?.activeTheme ?? null}
      onSelectTheme={onSelectTheme}
    />,
  );
  return { ...utils, onToggleCategory, onSelectCulture, onSelectTheme, onClose };
}

describe('FilterSheet (#212)', () => {
  it('renders category chips and culture rows together', () => {
    const { getByText } = setup();
    expect(getByText('Erdzeitalter')).toBeTruthy();
    expect(getByText('Alle anzeigen')).toBeTruthy();
    expect(getByText('griechisch')).toBeTruthy();
    expect(getByText('römisch')).toBeTruthy();
  });

  it('tapping a category chip toggles it', () => {
    const { getByText, onToggleCategory } = setup();
    fireEvent.press(getByText('Erdzeitalter'));
    expect(onToggleCategory).toHaveBeenCalledWith('erdzeitalter');
  });

  it('selecting a culture calls onSelectCulture without closing the sheet', () => {
    const { getByText, onSelectCulture, onClose } = setup();
    fireEvent.press(getByText('römisch'));
    expect(onSelectCulture).toHaveBeenCalledWith('römisch');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('selecting "Alle anzeigen" clears the culture filter', () => {
    const { getByText, onSelectCulture } = setup({ activeCulture: 'römisch' });
    fireEvent.press(getByText('Alle anzeigen'));
    expect(onSelectCulture).toHaveBeenCalledWith(null);
  });

  it('shows a hint when no cultures are available', () => {
    const { getByText } = setup({ cultures: [] });
    expect(getByText('Keine Kulturen für diesen Kontinent verfügbar')).toBeTruthy();
  });

  it('pressing "Fertig" closes the sheet', () => {
    const { getByText, onClose } = setup();
    fireEvent.press(getByText('Fertig'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders theme rows (#226)', () => {
    const { getByText } = setup();
    expect(getByText('Alle Themen')).toBeTruthy();
    expect(getByText('🚩 Kolonialismus & Eroberung')).toBeTruthy();
  });

  it('selecting a theme calls onSelectTheme without closing the sheet', () => {
    const { getByText, onSelectTheme, onClose } = setup();
    fireEvent.press(getByText('🚩 Kolonialismus & Eroberung'));
    expect(onSelectTheme).toHaveBeenCalledWith('kolonialismus');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('selecting "Alle Themen" clears the theme filter', () => {
    const { getByText, onSelectTheme } = setup({ activeTheme: 'kolonialismus' });
    fireEvent.press(getByText('Alle Themen'));
    expect(onSelectTheme).toHaveBeenCalledWith(null);
  });
});
