import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

/**
 * Three environments live in this repo and they get different globals:
 *  - src/       runs in the browser
 *  - tools/     runs in Node at build time
 *  - tests/     runs in Node under Playwright
 *
 * The generated config files (src/config/memes.ts, coin-history.ts) are written
 * by tools and are not hand-edited, so they are formatted but not linted for
 * style.
 */
export default [
  { ignores: ['dist/**', 'node_modules/**', '.astro/**', 'public/pfp/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  {
    // Browser code: everything the visitor's browser runs.
    files: ['src/**/*.{ts,astro}'],
    languageOptions: { globals: globals.browser },
  },
  {
    // Build-time code: Node only.
    files: ['tools/**/*.{js,mjs}', 'tests/**/*.ts', '*.config.{js,mjs,ts}'],
    languageOptions: { globals: { ...globals.node, ...globals.nodeBuiltin } },
  },
  {
    rules: {
      // Facts belong in src/config/site.ts; types belong on every value.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Build scripts report progress on stderr; the site itself stays quiet.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
