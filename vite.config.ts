/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Ships lib/styles.css unchanged as dist/styles.css: the plain-CSS alternative for projects without Tailwind.
const emitStylesCss = (): Plugin => ({
  name: 'emit-styles-css',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'styles.css',
      source: readFileSync(
        resolve(import.meta.dirname, 'lib/styles.css'),
        'utf8',
      ),
    })
  },
})

// https://vite.dev/config/
// Type declarations are emitted separately by `tsc -p tsconfig.build.json` (see the build script).
export default defineConfig({
  base: '/breadcrumb-nav/',
  plugins: [emitStylesCss()],
  build: {
    minify: true,
    reportCompressedSize: true,
    lib: {
      // ESM-only. `index` = server-safe React components + core; `core` = framework-agnostic functions;
      // `next` = Next.js wiring (client component); `element` = the custom element for every other framework.
      entry: {
        index: resolve(import.meta.dirname, 'lib/index.ts'),
        core: resolve(import.meta.dirname, 'lib/core.ts'),
        next: resolve(import.meta.dirname, 'lib/next.tsx'),
        element: resolve(import.meta.dirname, 'lib/element.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Always provided by the host app; `next` only by apps that import `breadcrumb-nav/next`.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'next',
        'next/link',
        'next/navigation',
      ],
      output: {
        // Unhashed shared-chunk names: npm versions the files, and size budgets need stable paths.
        chunkFileNames: 'chunks/[name].js',
        // Only the Next.js entry needs a client boundary (it calls usePathname). The React entry is
        // server-safe and must stay banner-free; scripts/check-package.mjs asserts both.
        banner: chunk => (chunk.name === 'next' ? "'use client'" : ''),
      },
    },
  },
  test: {
    // Default to Node; DOM-dependent test files opt in with `// @vitest-environment jsdom`.
    environment: 'node',
    include: [
      'lib/**/*.test.{ts,tsx}',
      'demo/**/*.test.{ts,tsx}',
      'scripts/**/*.test.mjs',
    ],
    alias: [
      {
        find: /^breadcrumb-nav$/,
        replacement: resolve(import.meta.dirname, 'lib/index.ts'),
      },
      {
        find: /^breadcrumb-nav\/core$/,
        replacement: resolve(import.meta.dirname, 'lib/core.ts'),
      },
      {
        find: /^breadcrumb-nav\/next$/,
        replacement: resolve(import.meta.dirname, 'lib/next.tsx'),
      },
      {
        find: /^breadcrumb-nav\/element$/,
        replacement: resolve(import.meta.dirname, 'lib/element.ts'),
      },
    ],
  },
})
