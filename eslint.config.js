import js from '@eslint/js';
import css from '@eslint/css';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'src/styles/scroll-state.css']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // react-hooks 7 ships new correctness rules that fire all over the
      // pre-existing components (and on the standard "fill this in after the
      // page loads" pattern the prerendered pages need). Kept visible as
      // warnings so the redesign can clear them, rather than blocking the build
      // on code it is about to replace.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      // Fast-refresh ergonomics, not correctness: the shadcn button/badge files
      // and the data context each export a helper next to their component.
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // One-off Node build scripts, not app code: they were never written to the
    // browser rules the block above applies.
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-useless-escape': 'off',
    },
  },
  {
    // Blocks the site from shipping CSS that is not yet safe everywhere.
    // Anything newer has to sit behind an @supports check, which the rule
    // treats as an explicit, deliberate progressive enhancement.
    files: ['src/**/*.css'],
    plugins: { css },
    language: 'css/css',
    languageOptions: {
      // Tailwind's own at-rules (@theme, @utility, @plugin, @source, @apply)
      // are not standard CSS; skip the parse errors they cause.
      tolerant: true,
    },
    rules: {
      'css/use-baseline': [
        'error',
        {
          available: 'widely',
          // Three exceptions, each because a @supports guard is impossible or
          // would make things worse:
          //  - `ui-sans-serif` / `ui-monospace` are the last-resort entries of a
          //    font stack. A browser that does not know them simply reads the
          //    next name, which is the whole point of a fallback list.
          //  - `@property` and `@starting-style` cannot be feature-detected;
          //    browsers that do not know them skip the block, which is the
          //    behaviour we want anyway.
          allowAtRules: ['property', 'starting-style'],
          allowPropertyValues: { 'font-family': ['ui-sans-serif', 'ui-monospace'] },
        },
      ],
    },
  },
  {
    // The redesign's own stylesheets. Baseline "newly" is the floor here:
    // everything this design uses reached all three engines within the last
    // two years, and "widely" is a 30-month lag that would ban light-dark(),
    // view transitions, progress(), sibling-index() and text-box-trim, which
    // is the point of the build. Two-engine and Chromium-only features still
    // have to sit behind @supports, and the one scroll-state() rule lives in
    // its own ignored file because this parser cannot read it.
    files: ['src/styles/**/*.css', 'src/sheets/**/*.css', 'src/pages/**/*.css', 'src/components/**/*.css'],
    plugins: { css },
    language: 'css/css',
    languageOptions: { tolerant: true },
    rules: {
      'css/use-baseline': [
        'error',
        {
          available: 'newly',
          allowAtRules: ['property', 'starting-style'],
          allowPropertyValues: { 'font-family': ['ui-sans-serif', 'ui-monospace'] },
        },
      ],
    },
  },
]);
