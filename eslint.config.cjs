const { FlatCompat } = require('@eslint/eslintrc');
const globals = require('globals');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'web-build/**', '.expo/**'],
  },
  ...compat.extends('expo'),
  // Node globals for config/script files (provides require, __dirname, etc.)
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  // Jest globals for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // `react-hooks/immutability` and `react-hooks/refs` are part of the
      // expo-extended eslint-plugin-react-hooks build.
      // Reanimated worklets write `.value` on shared values, and RNGH `.onEnd`
      // callbacks run outside render — both trigger false positives from these
      // rules. Downgrade to warn so CI isn't blocked.
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];
