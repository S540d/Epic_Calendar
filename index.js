import { registerRootComponent } from 'expo';
import App from './App';
import { Platform } from 'react-native';

async function main() {
  if (Platform.OS === 'web') {
    const { LoadSkiaWeb } = await import(
      '@shopify/react-native-skia/lib/module/web/LoadSkiaWeb'
    );
    await LoadSkiaWeb({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.39.1/bin/full/${file}`,
    });
  }
  registerRootComponent(App);
}

main();
