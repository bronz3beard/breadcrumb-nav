// @ts-check
// Package purity gate. Proves the published package is ESM-only, has zero runtime dependencies, never bundles React
// or Next.js, keeps the React entry server-safe, contains exactly the JSON-LD script sites it should and nothing
// else that writes raw HTML, ships only allow-listed files, and keeps the plain CSS file tiny.
// Uses node: built-ins only. Run after `npm run build`.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

// Per entry: which bare imports it may leave to the host app, how many JSON-LD script sites it contains
// (`dangerouslySetInnerHTML` is the only way React emits raw script text; the React entries get exactly one each
// from S4 onward), and whether it must carry a 'use client' banner.
const ENTRIES = {
  index: {
    allowedImports: ['react', 'react/jsx-runtime'],
    jsonLdSites: 0,
    useClient: false,
  },
  core: { allowedImports: [], jsonLdSites: 0, useClient: false },
  next: {
    allowedImports: [
      'react',
      'react/jsx-runtime',
      'next/link',
      'next/navigation',
    ],
    jsonLdSites: 0,
    useClient: true,
  },
  element: { allowedImports: [], jsonLdSites: 0, useClient: false },
}
const FORBIDDEN_IN_DIST = [
  '__SECRET_INTERNALS',
  '__CLIENT_INTERNALS',
  'process.env',
  'import.meta.env',
  'require(',
  'eval(',
  'new Function',
  '.innerHTML',
]
const EXPORT_KEYS = [
  '.',
  './core',
  './next',
  './element',
  './styles.css',
  './package.json',
]
const ALLOWED_PEERS = ['react', 'next']
const STYLES_MAX_BYTES = 1024
const ALLOWED_FILES = [
  /^package\.json$/,
  /^README\.md$/,
  /^LICENSE$/,
  /^dist\/.+$/,
]
const RUNTIME_DEPENDENCY_FIELDS = [
  'dependencies',
  'optionalDependencies',
  'bundleDependencies',
  'bundledDependencies',
]
const INSTALL_SCRIPTS = ['preinstall', 'install', 'postinstall', 'prepare']
const RELATIVE_IMPORT = /(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g

/** @type {string[]} */
const failures = []
/** @param {boolean} ok @param {string} message */
const check = (ok, message) => {
  if (!ok) failures.push(message)
}

/** The entry file plus every chunk it imports, transitively — what a bundler ships for that import. */
const withImports = (file, seen = new Set()) => {
  if (seen.has(file)) return seen
  seen.add(file)
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(
    RELATIVE_IMPORT,
  )) {
    withImports(normalize(join(dirname(file), specifier)), seen)
  }
  return seen
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
for (const field of RUNTIME_DEPENDENCY_FIELDS) {
  check(!(field in pkg), `package.json must not declare "${field}"`)
}
const peers = Object.keys(pkg.peerDependencies ?? {})
check(peers.includes('react'), 'peerDependencies must include react')
for (const peer of peers) {
  check(
    ALLOWED_PEERS.includes(peer),
    `peerDependencies must not include "${peer}"`,
  )
}
check(pkg.type === 'module', 'package must be ESM-only ("type": "module")')
check(
  JSON.stringify(pkg.sideEffects) === JSON.stringify(['*.css']),
  '"sideEffects" must be ["*.css"] (the JS is side-effect free; the stylesheet is not)',
)
check(
  JSON.stringify(Object.keys(pkg.exports ?? {})) ===
    JSON.stringify(EXPORT_KEYS),
  `exports must be exactly ${EXPORT_KEYS.join(', ')}`,
)
for (const script of INSTALL_SCRIPTS) {
  check(!pkg.scripts?.[script], `"${script}" must not run on consumer install`)
}

for (const [entry, rules] of Object.entries(ENTRIES)) {
  const exportKey = entry === 'index' ? '.' : `./${entry}`
  check(
    Object.keys(pkg.exports?.[exportKey] ?? {})[0] === 'types',
    `exports["${exportKey}"] must list "types" first`,
  )
  const dts = join('dist', `${entry}.d.ts`)
  check(
    existsSync(dts) && statSync(dts).size > 0,
    `${dts} must exist and be non-empty`,
  )

  const entryFile = join('dist', `${entry}.js`)
  if (!existsSync(entryFile)) {
    check(false, `${entryFile} is missing`)
    continue
  }
  const files = [...withImports(entryFile)]
  const code = files.map(file => readFileSync(file, 'utf8')).join('\n')

  const specifiers = [
    ...code.matchAll(
      /\bfrom\s*["']([^"']+)["']|\bimport\s*\(?\s*["']([^"']+)["']/g,
    ),
  ].map(match => match[1] ?? match[2])
  const bareImports = new Set(specifiers.filter(id => !/^[./]/.test(id)))
  for (const id of bareImports) {
    check(
      rules.allowedImports.includes(id),
      `${entry}: imports "${id}", which is not allow-listed for this entry`,
    )
  }
  for (const token of FORBIDDEN_IN_DIST) {
    check(!code.includes(token), `${entry}: must not contain "${token}"`)
  }
  const jsonLdSites = code.split('dangerouslySetInnerHTML').length - 1
  check(
    jsonLdSites === rules.jsonLdSites,
    `${entry}: expected ${rules.jsonLdSites} dangerouslySetInnerHTML site(s) across its import graph, found ${jsonLdSites}`,
  )
  const hasBanner =
    code.includes("'use client'") || code.includes('"use client"')
  check(
    hasBanner === rules.useClient,
    rules.useClient
      ? `${entry}: must carry a 'use client' banner (it uses client-only hooks)`
      : `${entry}: must not carry a 'use client' banner (it is server-safe)`,
  )
}

const stylesFile = join('dist', 'styles.css')
check(existsSync(stylesFile), `${stylesFile} is missing`)
if (existsSync(stylesFile)) {
  const bytes = statSync(stylesFile).size
  check(
    bytes <= STYLES_MAX_BYTES,
    `${stylesFile} is ${bytes} B, over the ${STYLES_MAX_BYTES} B limit`,
  )
}

// `npm pack --json` changed shape: npm 10 returns an array of packed packages, npm 12 returns an object keyed by
// package name. The entries themselves are identical, so accept either rather than pinning an npm version here.
const packOutput = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    encoding: 'utf8',
  }),
)
const [packed] = Array.isArray(packOutput)
  ? packOutput
  : Object.values(packOutput)
if (!packed?.files) {
  throw new Error(
    `could not read "npm pack --json" output (npm ${execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim()})`,
  )
}
for (const { path } of packed.files) {
  check(
    ALLOWED_FILES.some(pattern => pattern.test(path)),
    `tarball contains non-allow-listed file "${path}"`,
  )
}

console.log(
  `tarball: ${packed.files.length} files, ${packed.unpackedSize} B unpacked`,
)
if (failures.length > 0) {
  console.error(
    `✗ package purity: ${failures.length} failure(s)\n- ${failures.join('\n- ')}`,
  )
  process.exit(1)
}
console.log('✓ package purity: all checks passed')
