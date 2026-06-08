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
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  ...compat.extends('expo'),
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Reanimated worklets mutate shared values via `.value` — this is intentional
      // and the react-hooks/immutability rule does not understand the worklet pattern.
      'react-hooks/immutability': 'warn',
    },
  },
];
