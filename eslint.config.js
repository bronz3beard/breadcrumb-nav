import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'demo/dist', '.loop-out']),
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    // Build scripts run in Node; declare the two globals they use rather than pulling in a globals package.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
  },
  {
    // JSON-LD must be emitted as raw script text, which React only allows through dangerouslySetInnerHTML.
    // That is the single permitted site; scripts/check-package.mjs counts occurrences in the built output.
    files: ['lib/**/*.{ts,tsx}'],
    // Tests read container.innerHTML to inspect output; that is not writing HTML.
    ignores: ['lib/react/BreadcrumbJsonLd.tsx', 'lib/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'dangerouslySetInnerHTML is only allowed in lib/react/BreadcrumbJsonLd.tsx (the JSON-LD script).',
        },
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message:
            'Build DOM with createElement/textContent; innerHTML is banned in this package.',
        },
      ],
    },
  },
  // Must stay last: turns off stylistic rules that Prettier owns.
  prettier,
])
