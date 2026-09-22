// Fails when a package entry grows past its gzip budget. Each entry is measured with the chunks it imports, gzipped
// together, which is roughly what an app's bundler ships for that import. Budgets are the measured size + ~5%.
// Raise one only deliberately, with the reason in the commit message — never to silence an unexpected jump.
//
// PROVISIONAL: the numbers below are the ceilings agreed in the plan before any code existed. The first green build
// of each slice replaces its entry's ceiling with the measured size + ~5% and adds a dated line to this history.
// History (gzip, kB):
//          S0 (scaffold) — every entry empty.
//          S1 2026-09-22 — core 1.13 (path normalisation, basePath, trailing slash, label inference, pathLabels,
//                          BreadcrumbError). Budget set to 1.2; the other three entries stay at their plan ceilings.
//          S2 2026-09-22 — core 2.41 (+ route patterns :x/[x]/[...x]/*, specificity matching, parent chains with
//                          cycle and unknown-parent detection, hidden, strict, typed labels). Budget set to the
//                          plan's approved 2.5 ceiling (3.7% headroom) rather than measured + 5%.
//          S3 2026-09-22 — core 3.49 (+ BreadcrumbList JSON-LD with baseUrl validation, script-safe serialisation,
//                          renderBreadcrumbsHtml for SSR outside React, DEFAULT_CLASSES). Over the plan's 2.5
//                          ceiling, which was set before the audit added the SSR renderer; flagged to the Tech Lead.
//                          check-treeshake.mjs shows buildBreadcrumbs alone ships 2.41. Budget 3.7 (measured + ~5%).
//          S4 2026-09-22 — index 4.06 (core chunk 3.57 + the server-safe React components). Over the plan's 4.0
//                          ceiling for the same reason as core; budget 4.3 (measured + ~5%), flagged with core.
//                          Both accepted by the Tech Lead on 2026-09-22.
//          S5 2026-09-22 — next 3.76 (usePathname + next/link wiring over the shared React and core chunks).
//                          Budget 4.0 (measured + ~5%).
//          S6 2026-09-22 — element 4.04 (the custom element is ~0.45 over the shared core chunk). Over the plan's
//                          4.0 ceiling for the same accepted reason as core and index; budget 4.3 (measured + ~5%).
import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { withImports } from './import-graph.mjs'

const BUDGETS_KB = {
  core: 3.7,
  index: 4.3,
  next: 4.0,
  element: 4.3,
}

for (const [entry, budgetKb] of Object.entries(BUDGETS_KB)) {
  const files = [...withImports(join('dist', `${entry}.js`))]
  const sizeKb =
    gzipSync(Buffer.concat(files.map(file => readFileSync(file)))).length / 1024
  const withinBudget = sizeKb <= budgetKb
  if (!withinBudget) process.exitCode = 1
  console.log(
    `${withinBudget ? 'ok  ' : 'FAIL'} ${entry}: ${sizeKb.toFixed(2)} kB gzip (budget ${budgetKb} kB) — ${files.join(', ')}`,
  )
}
