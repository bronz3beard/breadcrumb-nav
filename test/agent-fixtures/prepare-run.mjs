// Prepares one cold run of the AI setup prompt: a fresh copy of a fixture (its installed node_modules linked, not
// copied), the prompt extracted verbatim from docs/agent-setup.md, and the facts sheet, laid out so the assistant's
// search for existing breadcrumbs cannot find the prompt itself. Usage, from the repository root:
//   node test/agent-fixtures/prepare-run.mjs next-app  runs/large-next
//   node test/agent-fixtures/prepare-run.mjs vite-app  runs/large-vite
// Then give the assistant runs/<name>/brief/PROMPT.txt and runs/<name>/repo, and grade with grade-*.mjs inside repo.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

const [fixture, target] = process.argv.slice(2)
if (!fixture || !target) {
  console.error(
    'usage: node test/agent-fixtures/prepare-run.mjs <next-app|vite-app> <target dir>',
  )
  process.exit(1)
}
const source = resolve('test/agent-fixtures/fixtures', fixture)
if (!existsSync(`${source}/node_modules`)) {
  console.error(
    `${source}/node_modules is missing: run \`npm run build\` at the root, then \`npm install\` inside ${source}`,
  )
  process.exit(1)
}
const prompt = /```text\n([\s\S]*?)\n```/.exec(
  readFileSync('docs/agent-setup.md', 'utf8'),
)?.[1]
if (!prompt)
  throw new Error('the prompt fence was not found in docs/agent-setup.md')

mkdirSync(`${target}/brief`, { recursive: true })
cpSync(source, `${target}/repo`, {
  recursive: true,
  filter: path => !/\/(node_modules|\.next|dist|FACTS\.md)(\/|$)/.test(path),
})
symlinkSync(`${source}/node_modules`, `${target}/repo/node_modules`)
writeFileSync(`${target}/brief/PROMPT.txt`, prompt + '\n')
cpSync(`${source}/FACTS.md`, `${target}/brief/FACTS.md`)
console.log(
  `ready: ${target}/repo (fixture ${fixture}), prompt and facts in ${target}/brief`,
)
