/* global jest */
// Components going through useTheme() (ThemeContext) pull in AsyncStorage,
// which has no native module under the plain 'node' test environment.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
