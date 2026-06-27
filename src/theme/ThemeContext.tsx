import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORY_COLORS, CATEGORY_LANE_BG } from './categories';

const STORAGE_KEY = 'theme_isDark';

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  category: typeof CATEGORY_COLORS;
  laneBg: typeof CATEGORY_LANE_BG;
};

export const darkColors: ThemeColors = {
  bg: '#0E1116',
  bgElevated: '#171B22',
  surface: '#1F242D',
  border: '#2A313C',
  textPrimary: '#F2F4F8',
  textSecondary: '#A8B0BB',
  textMuted: '#6B7280',
  accent: '#7C9CFF',
  category: CATEGORY_COLORS,
  laneBg: CATEGORY_LANE_BG,
};

export const lightColors: ThemeColors = {
  bg: '#F2F4F8',
  bgElevated: '#FFFFFF',
  surface: '#E8EBF0',
  border: '#D0D5DD',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  accent: '#5574D6',
  category: CATEGORY_COLORS,
  laneBg: CATEGORY_LANE_BG,
};

type ThemeContextValue = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw !== null) setIsDark(JSON.parse(raw) as boolean);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
