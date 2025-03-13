// eslint.config.js
import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginPromise from 'eslint-plugin-promise';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import ts from 'typescript-eslint';

export default ts.config(
  js.configs.recommended,
  ts.configs.recommended,
  prettierRecommended,
  pluginPromise.configs['flat/recommended'],
  {
    plugins: {
      import: pluginImport,
      'unused-imports': pluginUnusedImports,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off', // turned off in favor of unused-imports/no-unused-vars
      '@typescript-eslint/no-require-imports': 'warn',

      // Remove unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import organization
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          warnOnUnassignedImports: true,
        },
      ],
      'import/no-duplicates': 'error',
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./packages/*/tsconfig.json'],
        },
      },
    },
  },
  {
    ignores: [
      '**/dist',
      '**/_doNotUse',
      '**/node_modules',
      '**/.vinxi',
      '**/.output',
      '**/pnpm-lock.yaml',
      '**/routeTree.gen.ts',
      'scripts/verify-release-config.js',
      '**/.docusaurus',
      '**/build',
    ],
  },
);
