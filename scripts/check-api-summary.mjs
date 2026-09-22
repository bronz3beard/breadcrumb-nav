// Fails when a public name is missing from docs/api-summary.md, so the reference cannot fall behind the code.
// Names are read from the source with the TypeScript compiler API (top-level members only: the AST makes nesting
// explicit, which a regex cannot), plus the package.json entry points. A target that cannot be found, or that yields
// no names, is a failure, never a silent pass. The extractors are exported for the unit test beside this file.
import { readFileSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

export const parse = (text, fileName = 'source.tsx') =>
  ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

const nameText = node =>
  ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : node.getText()

const topLevel = (source, predicate) => {
  let found
  ts.forEachChild(source, node => {
    if (!found && predicate(node)) found = node
  })
  return found
}

/** Direct property names of an interface, or of a type alias whose type is an object literal. */
export function membersOf(source, typeName) {
  const node = topLevel(
    source,
    n =>
      (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) &&
      n.name.text === typeName,
  )
  if (!node) return undefined
  const members = ts.isInterfaceDeclaration(node)
    ? node.members
    : ts.isTypeLiteralNode(node.type)
      ? node.type.members
      : []
  return members
    .filter(m => ts.isPropertySignature(m) || ts.isMethodSignature(m))
    .map(m => nameText(m.name))
}

/** The string literals of a union type alias. */
export function unionMembersOf(source, typeName) {
  const node = topLevel(
    source,
    n => ts.isTypeAliasDeclaration(n) && n.name.text === typeName,
  )
  if (!node) return undefined
  const types = ts.isUnionTypeNode(node.type) ? node.type.types : [node.type]
  return types
    .filter(t => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal))
    .map(t => t.literal.text)
}

/** Every exported name: `export { a, type B } from`, and exported declarations. `export *` is not followed. */
export function exportNamesOf(source) {
  const names = []
  const isExported = n =>
    ts.canHaveModifiers(n) &&
    ts.getModifiers(n)?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
  ts.forEachChild(source, n => {
    if (
      ts.isExportDeclaration(n) &&
      n.exportClause &&
      ts.isNamedExports(n.exportClause)
    ) {
      for (const element of n.exportClause.elements)
        names.push(element.name.text)
    } else if (isExported(n)) {
      if (ts.isVariableStatement(n)) {
        for (const d of n.declarationList.declarations)
          names.push(nameText(d.name))
      } else if (n.name) {
        names.push(n.name.text)
      }
    }
  })
  return names
}

/** The string elements of `static <propertyName> = [...]` in a class. */
export function staticArrayOf(source, className, propertyName) {
  const cls = topLevel(
    source,
    n => ts.isClassDeclaration(n) && n.name?.text === className,
  )
  const prop = cls?.members.find(
    m => ts.isPropertyDeclaration(m) && nameText(m.name) === propertyName,
  )
  if (
    !prop ||
    !prop.initializer ||
    !ts.isArrayLiteralExpression(prop.initializer)
  )
    return undefined
  return prop.initializer.elements.filter(ts.isStringLiteral).map(e => e.text)
}

/** The names of `get` accessors in a class: its public properties. */
export function accessorsOf(source, className) {
  const cls = topLevel(
    source,
    n => ts.isClassDeclaration(n) && n.name?.text === className,
  )
  if (!cls) return undefined
  return cls.members
    .filter(ts.isGetAccessorDeclaration)
    .map(m => nameText(m.name))
}

const TARGETS = [
  ['lib/core/types.ts', 'members', 'BuildOptions'],
  ['lib/core/types.ts', 'members', 'RouteDef'],
  ['lib/core/types.ts', 'members', 'HomeOptions'],
  ['lib/core/types.ts', 'members', 'Crumb'],
  ['lib/core/types.ts', 'members', 'LabelContext'],
  ['lib/core/html.ts', 'members', 'RenderOptions'],
  ['lib/core/classes.ts', 'members', 'ClassNames'],
  ['lib/core/jsonld.ts', 'members', 'BreadcrumbListItem'],
  ['lib/core/errors.ts', 'union', 'BreadcrumbErrorCode'],
  ['lib/react/Breadcrumbs.tsx', 'members', 'RenderProps'],
  ['lib/react/Breadcrumbs.tsx', 'members', 'LinkProps'],
  ['lib/react/BreadcrumbJsonLd.tsx', 'members', 'BreadcrumbJsonLdProps'],
  [
    'lib/element/BreadcrumbNavElement.ts',
    'staticArray',
    'BreadcrumbNavElement',
    'observedAttributes',
  ],
  ['lib/element/BreadcrumbNavElement.ts', 'accessors', 'BreadcrumbNavElement'],
  ['lib/core.ts', 'exports'],
  ['lib/index.ts', 'exports'],
  ['lib/next.tsx', 'exports'],
  ['lib/element.ts', 'exports'],
]

/** Every public name, grouped by where it came from. Throws when a target is missing or empty. */
export function collectPublicNames(
  readFile = file => readFileSync(file, 'utf8'),
) {
  const groups = []
  for (const [file, kind, name, property] of TARGETS) {
    const source = parse(readFile(file), file)
    const names =
      kind === 'members'
        ? membersOf(source, name)
        : kind === 'union'
          ? unionMembersOf(source, name)
          : kind === 'staticArray'
            ? staticArrayOf(source, name, property)
            : kind === 'accessors'
              ? accessorsOf(source, name)
              : exportNamesOf(source)
    const label = `${file}${name ? ` ${name}` : ''}${property ? `.${property}` : ''}`
    if (!names)
      throw new Error(
        `could not find ${label}: the extractor may be out of date`,
      )
    if (names.length === 0)
      throw new Error(
        `${label} yielded no names: the extractor may be out of date`,
      )
    groups.push({ label, names })
  }
  const exportsMap = JSON.parse(readFile('package.json')).exports
  groups.push({
    label: 'package.json exports',
    names: Object.keys(exportsMap)
      .filter(key => key !== './package.json')
      .map(key =>
        key === '.' ? 'breadcrumb-nav' : `breadcrumb-nav/${key.slice(2)}`,
      ),
  })
  return groups
}

/** Output shapes, not settings: an assistant never types these, so the prompt's list leaves them out. */
const NOT_SETTINGS = new Set([
  'lib/core/types.ts Crumb',
  'lib/core/types.ts LabelContext',
  'lib/core/jsonld.ts BreadcrumbListItem',
])
export const settingsGroups = groups =>
  groups.filter(group => !NOT_SETTINGS.has(group.label))

/** The first line of the prompt in docs/agent-setup.md: it must exist there once and nowhere else. */
export const PROMPT_OPENING =
  'You are setting up breadcrumb-nav in this repository'

/** The ALLOWED SETTINGS block of the prompt, up to the end of its code fence. */
export const allowedSettingsIn = document =>
  /ALLOWED SETTINGS\n([\s\S]*?)\n```/.exec(document)?.[1]

/** The names that a document does not mention in backticks. */
export const undocumentedIn = (document, groups) =>
  groups.flatMap(({ label, names }) =>
    names
      .filter(name => !document.includes(`\`${name}\``))
      .map(name => `${label}: ${name}`),
  )

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const groups = collectPublicNames()
  const summary = readFileSync('docs/api-summary.md', 'utf8')
  for (const { label, names } of groups)
    console.log(`${String(names.length).padStart(3)}  ${label}`)
  const missing = undocumentedIn(summary, groups)
  const total = groups.reduce((n, g) => n + g.names.length, 0)
  if (missing.length > 0) {
    console.error(
      `✗ api summary: ${missing.length} of ${total} names undocumented\n- ${missing.join('\n- ')}`,
    )
    process.exit(1)
  }
  console.log(`✓ api summary: all ${total} public names are documented`)

  // The AI setup prompt: its ALLOWED SETTINGS list must cover every setting, and it must exist exactly once.
  const prompt = readFileSync('docs/agent-setup.md', 'utf8')
  const allowed = allowedSettingsIn(prompt)
  const failures = []
  if (!allowed)
    failures.push(
      'docs/agent-setup.md has no ALLOWED SETTINGS block inside the prompt fence',
    )
  else failures.push(...undocumentedIn(allowed, settingsGroups(groups)))
  const copies = prompt.split(PROMPT_OPENING).length - 1
  if (copies !== 1)
    failures.push(
      `the prompt opening line appears ${copies} times in docs/agent-setup.md, expected 1`,
    )
  const otherFiles = [
    'README.md',
    ...readdirSync('docs')
      .filter(f => f.endsWith('.md') && f !== 'agent-setup.md')
      .map(f => `docs/${f}`),
  ]
  for (const file of otherFiles) {
    if (readFileSync(file, 'utf8').includes(PROMPT_OPENING))
      failures.push(
        `${file} contains a copy of the prompt; it must live only in docs/agent-setup.md`,
      )
  }
  if (!readFileSync('README.md', 'utf8').includes('docs/agent-setup.md'))
    failures.push('README.md does not link to docs/agent-setup.md')
  const settingsTotal = settingsGroups(groups).reduce(
    (n, g) => n + g.names.length,
    0,
  )
  if (failures.length > 0) {
    console.error(
      `✗ agent setup prompt: ${failures.length} failure(s)\n- ${failures.join('\n- ')}`,
    )
    process.exit(1)
  }
  console.log(
    `✓ agent setup prompt: all ${settingsTotal} settings are in ALLOWED SETTINGS, one copy, linked from the README`,
  )
}
