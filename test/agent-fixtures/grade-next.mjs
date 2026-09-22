// Objective checks for a run of the agent-setup prompt against the next-app fixture. Run inside a fixture copy made by prepare-run.mjs.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const files = dir =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
const src = files('src').filter(f => /\.(tsx?|css|jsx?)$/.test(f))
const read = f => readFileSync(f, 'utf8')
const all = Object.fromEntries(src.map(f => [f, read(f)]))
const count = (text, needle) => text.split(needle).length - 1

const results = []
const check = (name, ok, detail = '') => results.push({ name, ok, detail })

check(
  '1 old component no longer imported',
  !Object.values(all).some(t => t.includes('SiteBreadcrumbs')),
  Object.keys(all)
    .filter(f => all[f].includes('SiteBreadcrumbs'))
    .join(', '),
)
check(
  '2 no hand-written BreadcrumbList / ld+json in src',
  !Object.values(all).some(
    t => t.includes('BreadcrumbList') || t.includes('application/ld+json'),
  ),
)
const layout = all['src/app/layout.tsx'] ?? ''
const formPage = all['src/app/forms/[id]/page.tsx'] ?? ''
const inLayout = count(layout, '<Breadcrumbs')
const inFormPage = count(formPage, '<Breadcrumbs')
check(
  '3 exactly one trail per page',
  inLayout <= 1 &&
    inFormPage <= 1 &&
    !(inLayout === 1 && inFormPage === 1) &&
    inLayout + inFormPage >= 1,
  `layout=${inLayout} formPage=${inFormPage}`,
)
const baseUrlLines = Object.values(all).flatMap(t =>
  t.split('\n').filter(l => /baseUrl|base-url/.test(l)),
)
const constOrigin = Object.values(all).some(t =>
  t.includes('https://acme-forms.example'),
)
check(
  '4 baseUrl is the real origin',
  baseUrlLines.length > 0 &&
    constOrigin &&
    !baseUrlLines.some(l => /localhost|example\.com/.test(l)),
  baseUrlLines.join(' | '),
)
const css = existsSync('src/app/globals.css') ? read('src/app/globals.css') : ''
check(
  '5 @source path is relative to src/app/globals.css',
  /@source\s+["']\.\.\/\.\.\/node_modules\/breadcrumb-nav\/dist\/?["']/.test(
    css,
  ),
  css
    .split('\n')
    .filter(l => l.includes('@source'))
    .join(' | '),
)
check('6 no fetch added', !Object.values(all).some(t => t.includes('fetch(')))
let typecheck
try {
  execFileSync('npx', ['tsc', '--noEmit'], { stdio: 'pipe' })
  typecheck = 'ok'
} catch (error) {
  typecheck = String(error.stdout ?? error.message)
    .split('\n')
    .slice(0, 5)
    .join(' / ')
}
check('7 tsc --noEmit passes', typecheck === 'ok', typecheck)
const allText = Object.values(all).join('\n')
check(
  '8 /settings (no page of its own) declared hidden and routes passed',
  /defineRoutes/.test(allText) &&
    /path:\s*['"]\/settings['"][^}]*hidden:\s*true/s.test(allText) &&
    /routes=\{/.test(allText),
)
// A wrapper: any file other than the layout or the form page that imports the component from the package and
// renders JSX. The prompt forbids wrappers, and a wrapper with the same name would otherwise fool check 3.
const renderers = Object.entries(all)
  .filter(
    ([, t]) =>
      /from ['"]breadcrumb-nav(\/next)?['"]/.test(t) &&
      /<[A-Z][^>]*\/?>/.test(t),
  )
  .map(([f]) => f)
const allowedRenderers = ['src/app/layout.tsx', 'src/app/forms/[id]/page.tsx']
check(
  '9 no wrapper component around the trail',
  renderers.every(f => allowedRenderers.includes(f)),
  renderers.join(', '),
)
if (formPage.includes('<Breadcrumbs')) {
  check(
    '3b form page names the form',
    formPage.includes('pathLabels') && /form\.name|\bname\b/.test(formPage),
  )
}

for (const { name, ok, detail } of results)
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`,
  )
const failed = results.filter(r => !r.ok).length
console.log(failed === 0 ? 'RESULT: PASS' : `RESULT: FAIL (${failed})`)
process.exit(failed === 0 ? 0 : 1)
