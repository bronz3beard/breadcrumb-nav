import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// The playground, published to GitHub Pages by .github/workflows/pages.yml. It imports the library by its package
// name, as an app would, and its stylesheet points Tailwind at this repository's own `dist`, so building it is also
// the proof that Tailwind generates every default class (see scripts/check-classes.mjs).
export default defineConfig({
  root: import.meta.dirname,
  base: '/breadcrumb-nav/',
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^breadcrumb-nav$/,
        replacement: resolve(import.meta.dirname, '../lib/index.ts'),
      },
      {
        find: /^breadcrumb-nav\/core$/,
        replacement: resolve(import.meta.dirname, '../lib/core.ts'),
      },
      {
        find: /^breadcrumb-nav\/element$/,
        replacement: resolve(import.meta.dirname, '../lib/element.ts'),
      },
    ],
  },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
})
