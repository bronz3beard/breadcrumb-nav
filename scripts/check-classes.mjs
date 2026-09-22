// Tailwind generates a utility only when its scanner finds the class name as a whole token in some source file, and
// consumers point it at `dist` with an @source line. This proves every default class string survived the build as
// one literal in each entry that renders markup (concatenation or template pieces would silently lose them).
// The end-to-end proof, that Tailwind actually emits a rule for each utility, is the demo build's CSS (see S9).
// Run after `npm run build`.
import { pathToFileURL } from 'node:url'
import { graphSource } from './import-graph.mjs'

const RENDERING_ENTRIES = ['index', 'next', 'element']

const { DEFAULT_CLASSES } = await import(
  pathToFileURL(`${process.cwd()}/dist/core.js`).href
)

const failures = []
for (const entry of RENDERING_ENTRIES) {
  const source = graphSource(`dist/${entry}.js`)
  for (const [slot, classes] of Object.entries(DEFAULT_CLASSES)) {
    if (!source.includes(`"${classes}"`) && !source.includes(`'${classes}'`)) {
      failures.push(
        `${entry}: default classes for "${slot}" are not one string literal in the built output`,
      )
    }
  }
}

const utilities = new Set(
  Object.values(DEFAULT_CLASSES).flatMap(classes => classes.split(' ')),
)
console.log(
  `classes: ${utilities.size} utilities across ${Object.keys(DEFAULT_CLASSES).length} slots, checked in ${RENDERING_ENTRIES.join(', ')}`,
)
if (failures.length > 0) {
  console.error(
    `✗ classes: ${failures.length} failure(s)\n- ${failures.join('\n- ')}`,
  )
  process.exit(1)
}
console.log('✓ classes: every default class string is intact in the build')
