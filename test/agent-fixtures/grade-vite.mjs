// Objective checks for a run of the agent-setup prompt against the vite-app fixture. Run inside a fixture copy made by prepare-run.mjs.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const files = dir =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
const src = files('src').filter(f => /\.(jsx?|tsx?|css)$/.test(f))
const all = Object.fromEntries(src.map(f => [f, readFileSync(f, 'utf8')]))
const text = Object.values(all).join('\n')
const count = (s, needle) => s.split(needle).length - 1

const results = []
const check = (name, ok, detail = '') => results.push({ name, ok, detail })

check(
  '1 old component unused and no localStorage trail',
  !Object.values(all).some(t => t.includes('components/Breadcrumbs')) &&
    !text.includes('localStorage'),
)
const root = all['src/Root.jsx'] ?? ''
const product = all['src/pages/ProductPage.jsx'] ?? ''
const inRoot = count(root, '<Breadcrumbs')
const inProduct = count(product, '<Breadcrumbs')
check(
  '2 exactly one trail per page',
  inRoot <= 1 &&
    inProduct <= 1 &&
    !(inRoot === 1 && inProduct === 1) &&
    inRoot + inProduct >= 1,
  `root=${inRoot} product=${inProduct}`,
)
const baseUrlLines = text.split('\n').filter(l => /baseUrl/.test(l))
check(
  '3 baseUrl is the real origin',
  baseUrlLines.length > 0 &&
    baseUrlLines.every(l =>
      /tots-store\.example|VITE_SITE_URL|SITE_URL|baseUrl=\{[A-Za-z_]+\}/.test(
        l,
      ),
    ) &&
    !baseUrlLines.some(l => /localhost|example\.com/.test(l)) &&
    (text.includes('https://tots-store.example') ||
      text.includes('VITE_SITE_URL')),
  baseUrlLines.join(' | '),
)
const styleImports = (
  text.match(/import\s+['"]breadcrumb-nav\/styles\.css['"]/g) ?? []
).length
check(
  '4 plain stylesheet imported once and unstyled passed',
  styleImports === 1 && /\bunstyled\b/.test(text),
  `imports=${styleImports}`,
)
check(
  '5 /returns declared under /account/orders',
  /defineRoutes/.test(text) &&
    /path:\s*['"]\/returns['"][^}]*parent:\s*['"]\/account\/orders['"]/s.test(
      text,
    ),
)
check(
  '6 product name reaches the trail',
  /pathLabels|label\s*:/.test(text) && /product\.name|getProduct/.test(text),
)
check('7 no fetch added', !text.includes('fetch('))
const renderers = Object.entries(all)
  .filter(
    ([, t]) =>
      /from ['"]breadcrumb-nav['"]/.test(t) && /<[A-Z][^>]*\/?>/.test(t),
  )
  .map(([f]) => f)
check(
  '9 no wrapper component around the trail',
  renderers.every(f =>
    ['src/Root.jsx', 'src/pages/ProductPage.jsx'].includes(f),
  ),
  renderers.join(', '),
)
let build
try {
  execFileSync('npx', ['vite', 'build'], { stdio: 'pipe' })
  build = 'ok'
} catch (error) {
  build = String(error.stderr ?? error.message)
    .split('\n')
    .slice(0, 5)
    .join(' / ')
}
check('8 vite build passes', build === 'ok', build)

for (const { name, ok, detail } of results)
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`,
  )
const failed = results.filter(r => !r.ok).length
console.log(failed === 0 ? 'RESULT: PASS' : `RESULT: FAIL (${failed})`)
process.exit(failed === 0 ? 0 : 1)
