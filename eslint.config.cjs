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
      // `react-hooks/immutability` is part of the expo-extended build of
      // eslint-plugin-react-hooks (verified at runtime: the rule is present).
      // Reanimated worklets intentionally write to `.value` on shared values —
      // downgrade to warn so CI isn't blocked by false positives.
      'react-hooks/immutability': 'warn',
    },
  },
  {
    // `react-hooks/refs` flags RNGH `.onEnd` callbacks inside useMemo as
    // "render-time ref access" — false positive because gesture callbacks
    // run outside render. Scope the downgrade to this file only so real
    // ref misuses elsewhere still surface as errors.
    files: ['**/TimelineView.tsx'],
    rules: {
      'react-hooks/refs': 'warn',
    },
  },
];
