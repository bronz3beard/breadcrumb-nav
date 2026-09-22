// Tailwind generates a utility only when its scanner finds the class name as a whole token in some source file, and
// consumers point it at `dist` with an @source line. Two checks, then:
//  1. every default class string survived the build as one literal in each entry that renders markup (concatenation
//     or template pieces would silently lose them);
//  2. the demo's built CSS, whose stylesheet points Tailwind at `dist` exactly as a consumer's does, contains a rule
//     for every utility. That is the end-to-end proof.
// Run after `npm run build` and `npm run demo:build`.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { graphSource } from './import-graph.mjs'

const RENDERING_ENTRIES = ['index', 'next', 'element']
const DEMO_CSS_DIR = 'demo/dist/assets'

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

// Tailwind writes a utility's selector with `.`, `:` and `/` escaped: `.gap-x-1\.5`, `.focus-visible\:outline-2`.
const selectorOf = utility =>
  '.' + utility.replace(/[.:/]/g, match => '\\' + match)
if (!existsSync(DEMO_CSS_DIR)) {
  failures.push(
    'demo/dist is missing: run `npm run demo:build` first (the demo CSS is the Tailwind proof)',
  )
} else {
  const css = readdirSync(DEMO_CSS_DIR)
    .filter(name => name.endsWith('.css'))
    .map(name => readFileSync(`${DEMO_CSS_DIR}/${name}`, 'utf8'))
    .join('\n')
  for (const utility of utilities) {
    if (!css.includes(selectorOf(utility))) {
      failures.push(
        `Tailwind emitted no rule for "${utility}" in the demo build (is the @source line right?)`,
      )
    }
  }
}

console.log(
  `classes: ${utilities.size} utilities across ${Object.keys(DEFAULT_CLASSES).length} slots, checked in ${RENDERING_ENTRIES.join(', ')} and in the demo CSS`,
)
if (failures.length > 0) {
  console.error(
    `✗ classes: ${failures.length} failure(s)\n- ${failures.join('\n- ')}`,
  )
  process.exit(1)
}
console.log(
  '✓ classes: every default class string is intact in the build, and Tailwind emits a rule for each utility',
)
