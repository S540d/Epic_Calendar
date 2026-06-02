import { registerRootComponent } from 'expo';
import App from './App';
import { Platform } from 'react-native';

async function main() {
  if (Platform.OS === 'web') {
    const { LoadSkiaWeb } = await import(
      '@shopify/react-native-skia/lib/module/web'
    );
    await LoadSkiaWeb({
      locateFile: file => `/Epic_Calendar/static/js/${file}`,
    });
  }
  registerRootComponent(App);
}

main();
