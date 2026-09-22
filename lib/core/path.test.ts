import { describe, expect, it } from 'vitest'
import { BreadcrumbError } from './errors.js'
import { joinPath, normalisePath, splitPath } from './path.js'

describe('splitPath', () => {
  it('returns no segments for the root', () => {
    expect(splitPath('/')).toEqual([])
  })

  it('drops the query string and hash', () => {
    expect(splitPath('/docs/guides?page=2#intro').map(s => s.raw)).toEqual([
      'docs',
      'guides',
    ])
  })

  it('collapses repeated and trailing slashes', () => {
    expect(splitPath('//docs///guides/').map(s => s.raw)).toEqual([
      'docs',
      'guides',
    ])
  })

  it('keeps the raw spelling for hrefs and decodes for labels', () => {
    expect(splitPath('/caf%C3%A9')).toEqual([
      { raw: 'caf%C3%A9', decoded: 'café' },
    ])
  })

  it('throws INVALID_PATH for a path without a leading slash', () => {
    expect(() => splitPath('docs/guides')).toThrowError(BreadcrumbError)
    expect(() => splitPath('docs/guides')).toThrowError(
      /must be a string starting with "\/"/,
    )
  })

  it('throws INVALID_PATH for a full URL, naming the fix', () => {
    expect(() => splitPath('https://example.com/docs')).toThrow(
      /not a full URL/,
    )
  })

  it('throws INVALID_PATH for a malformed percent-encoding', () => {
    let error: unknown
    try {
      splitPath('/bad%E0%A4%A')
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(BreadcrumbError)
    expect((error as BreadcrumbError).code).toBe('INVALID_PATH')
  })
})

describe('joinPath', () => {
  it('renders the root as "/" under both trailing-slash policies', () => {
    expect(joinPath([], 'never')).toBe('/')
    expect(joinPath([], 'always')).toBe('/')
  })

  it('applies the trailing-slash policy below the root', () => {
    const segments = splitPath('/a/b')
    expect(joinPath(segments, 'never')).toBe('/a/b')
    expect(joinPath(segments, 'always')).toBe('/a/b/')
  })
})

describe('normalisePath', () => {
  it('gives one canonical spelling for equivalent paths', () => {
    expect(normalisePath('/forms/', 'never')).toBe('/forms')
    expect(normalisePath('/forms', 'always')).toBe('/forms/')
    expect(normalisePath('//forms//42?x=1', 'never')).toBe('/forms/42')
  })
})
