import { describe, expect, it } from 'vitest'
import {
  accessorsOf,
  collectPublicNames,
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

  it('reports a name that the document does not mention in backticks', () => {
    const groups = [{ label: 'x', names: ['documented', 'forgotten'] }]
    expect(undocumentedIn('mentions `documented` only', groups)).toEqual([
      'x: forgotten',
    ])
    expect(undocumentedIn('`documented` and `forgotten`', groups)).toEqual([])
  })
})
