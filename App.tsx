import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import '@/i18n';
import i18n from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { TimelineScreen } from '@/screens/TimelineScreen';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    AsyncStorage.getItem('i18n_language')
      .then((lang) => {
        if (lang) i18n.changeLanguage(lang);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TimelineScreen />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
