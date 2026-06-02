import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { TimelineScreen } from '@/screens/TimelineScreen';

const CANVASKIT_URL =
  'https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.39.1/bin/full/canvaskit.wasm';

function AppInner() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <TimelineScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <WithSkiaWeb
        opts={{ locateFile: () => CANVASKIT_URL }}
        getComponent={() => Promise.resolve({ default: AppInner })}
      />
    );
  }
  return <AppInner />;
}
