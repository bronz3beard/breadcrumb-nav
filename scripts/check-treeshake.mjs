// Proves that importing only `buildBreadcrumbs` from the core entry does not drag the HTML renderer or the JSON-LD
// builder into a consumer's bundle. Bundles a fixture against the built `dist/` with Vite's own build API.
// Run after `npm run build`.
import { mkdirSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

const WORK_DIR = 'node_modules/.cache/treeshake'
// Text that only the parts we did not import contain.
const MUST_NOT_APPEAR = [
  'application/ld+json',
  '<nav',
  'schema.org',
  'data-crumb',
]

mkdirSync(WORK_DIR, { recursive: true })
const entry = `${WORK_DIR}/entry.js`
writeFileSync(
  entry,
  `import { buildBreadcrumbs } from '${process.cwd()}/dist/core.js'\nexport { buildBreadcrumbs }\n`,
)

const result = await build({
  logLevel: 'silent',
  // Without this the project's vite.config.ts (the library build) is merged in.
  configFile: false,
  build: {
    write: false,
    minify: true,
    lib: { entry, formats: ['es'], fileName: 'bundle' },
  },
})
const code = [result].flat()[0].output[0].code
const leaked = MUST_NOT_APPEAR.filter(text => code.includes(text))

console.log(
  `tree-shaking: buildBreadcrumbs alone = ${gzipSync(code).length} B gzip`,
)
if (leaked.length > 0) {
  console.error(
    `✗ tree-shaking: unused code bundled — found ${leaked.map(t => JSON.stringify(t)).join(', ')}`,
  )
  process.exit(1)
}
console.log('✓ tree-shaking: only the imported function ships')
