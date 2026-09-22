import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  accessorsOf,
  allowedSettingsIn,
  collectPublicNames,
  PROMPT_OPENING,
  settingsGroups,
  exportNamesOf,
  membersOf,
  parse,
  staticArrayOf,
  undocumentedIn,
  unionMembersOf,
} from './check-api-summary.mjs'

// Nested object types and inline parameter objects are exactly what a line-based regex would misreport as
// top-level members. The extractor must see only the real members.
const fixture = parse(`
export interface Options {
  a: string
  nested?: { inner: number; deep?: { deeper: string } }
  fn(param: { inlineArg: string }): void
  'quoted-name'?: boolean
}
export type Alias = { x: string; inside: { notTopLevel: 1 } }
export type Code = 'X' | 'Y'
export function f() {}
export const g = 1
export { h, type I } from './x.js'
export class C {
  static observedAttributes = ['p', 'q']
  get r() { return 1 }
  set r(v) {}
  get s() { return 2 }
  #t = 0
}
`)

describe('membersOf', () => {
  it('returns only the direct members of an interface, never nested or parameter names', () => {
    expect(membersOf(fixture, 'Options')).toEqual([
      'a',
      'nested',
      'fn',
      'quoted-name',
    ])
    const flat = membersOf(fixture, 'Options').join(' ')
    for (const nested of ['inner', 'deep', 'deeper', 'inlineArg'])
      expect(flat).not.toContain(nested)
  })

  it('reads a type alias with an object literal the same way', () => {
    expect(membersOf(fixture, 'Alias')).toEqual(['x', 'inside'])
  })

  it('returns undefined for a name that does not exist, so the gate can fail loudly', () => {
    expect(membersOf(fixture, 'Missing')).toBeUndefined()
  })
})

describe('the other extractors', () => {
  it('reads string-literal unions', () => {
    expect(unionMembersOf(fixture, 'Code')).toEqual(['X', 'Y'])
  })

  it('reads every exported name, declared or re-exported', () => {
    expect(exportNamesOf(fixture).sort()).toEqual(
      ['Alias', 'C', 'Code', 'Options', 'f', 'g', 'h', 'I'].sort(),
    )
  })

  it('reads a static array and the get accessors of a class', () => {
    expect(staticArrayOf(fixture, 'C', 'observedAttributes')).toEqual([
      'p',
      'q',
    ])
    expect(accessorsOf(fixture, 'C')).toEqual(['r', 's'])
  })
})

describe('the gate against the real source', () => {
  it('finds every target and none of them is empty', () => {
    const groups = collectPublicNames()
    expect(groups.length).toBeGreaterThan(15)
    for (const { names } of groups) expect(names.length).toBeGreaterThan(0)
  })

  it('extracts the ALLOWED SETTINGS block of the prompt and stops at the fence', () => {
    const doc =
      'intro\n```text\nRULES\n- x\nALLOWED SETTINGS\nline one `a`\nline two `b`\n```\n\n## After\n`c`'
    expect(allowedSettingsIn(doc)).toBe('line one `a`\nline two `b`')
    expect(allowedSettingsIn('no block here')).toBeUndefined()
  })

  it('leaves output shapes out of the settings groups', () => {
    const labels = settingsGroups(collectPublicNames()).map(g => g.label)
    expect(labels).not.toContain('lib/core/types.ts Crumb')
    expect(labels).toContain('lib/core/types.ts BuildOptions')
  })

  it('finds the prompt exactly once in the real docs', () => {
    const prompt = readFileSync('docs/agent-setup.md', 'utf8')
    expect(prompt.split(PROMPT_OPENING)).toHaveLength(2)
    expect(allowedSettingsIn(prompt)).toBeDefined()
  })

  it('reports a name that the document does not mention in backticks', () => {
    const groups = [{ label: 'x', names: ['documented', 'forgotten'] }]
    expect(undocumentedIn('mentions `documented` only', groups)).toEqual([
      'x: forgotten',
    ])
    expect(undocumentedIn('`documented` and `forgotten`', groups)).toEqual([])
  })
})
