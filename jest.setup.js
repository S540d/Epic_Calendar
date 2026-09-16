/* global jest */
// Components going through useTheme() (ThemeContext) pull in AsyncStorage,
// which has no native module under the plain 'node' test environment.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// react-native-worklets >=0.7 throws a hard WorkletsError when its native part
// isn't initialized, instead of the silent no-op fallback earlier versions
// used under the plain 'node' test environment (surfaced by the Expo SDK 55
// step of the #221 migration). react-native-reanimated's own official mock
// still internally requires the real `react-native-worklets` (its index.ts
// re-exports several non-worklet utilities from there), so that package
// needs its own official mock too — jest.mock() patches the whole module
// graph for a given specifier, not just this file's own imports, so this
// also covers reanimated's internal require chain.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
// react-native-reanimated's mock deliberately leaves out `useFrameCallback`
// ("ADD ME IF NEEDED" in its source) — only `useFpsMonitor.ts` needs it, so
// it's stubbed here rather than upstream.
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.useFrameCallback = () => ({ setActive: jest.fn() });
  return Reanimated;
});
