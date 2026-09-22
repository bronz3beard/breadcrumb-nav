import { describe, expect, it } from 'vitest'
import { BreadcrumbError } from './errors.js'
import { serializeJsonLd, toJsonLd } from './jsonld.js'
import {
  FIXTURE_BASE_URL,
  FIXTURE_CRUMBS,
  FIXTURE_JSON_LD,
} from '../test/fixture.js'
import type { Crumb } from './types.js'

const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn()
  } catch (error) {
    return (error as BreadcrumbError).code
  }
  return undefined
}

describe('toJsonLd', () => {
  it('produces the exact schema.org BreadcrumbList for a trail', () => {
    expect(
      toJsonLd({ crumbs: FIXTURE_CRUMBS, baseUrl: FIXTURE_BASE_URL }),
    ).toEqual(FIXTURE_JSON_LD)
  })

  it('numbers positions from 1 consecutively and names every item after its visible label', () => {
    const crumbs: Crumb[] = [
      { href: '/', label: 'Home', current: false, params: {} },
      { href: '/a/b/c', label: 'C', current: true, params: {} },
    ]
    const { itemListElement } = toJsonLd({ crumbs, baseUrl: FIXTURE_BASE_URL })
    expect(itemListElement.map(item => item.position)).toEqual([1, 2])
    expect(itemListElement.map(item => item.name)).toEqual(
      crumbs.map(crumb => crumb.label),
    )
  })

  it('omits item on the current page and gives every other page an absolute URL', () => {
    const { itemListElement } = toJsonLd({
      crumbs: FIXTURE_CRUMBS,
      baseUrl: FIXTURE_BASE_URL,
    })
    expect(itemListElement.at(-1)).not.toHaveProperty('item')
    expect(
      itemListElement.slice(0, -1).every(i => i.item?.startsWith('https://')),
    ).toBe(true)
  })

  it('does not double a path that both baseUrl and href carry', () => {
    const crumbs: Crumb[] = [
      { href: '/docs', label: 'Docs', current: false, params: {} },
      { href: '/docs/guide', label: 'Guide', current: true, params: {} },
    ]
    expect(
      toJsonLd({ crumbs, baseUrl: 'https://example.com/docs' })
        .itemListElement[0].item,
    ).toBe('https://example.com/docs')
  })

  it('keeps encoded hrefs as they are', () => {
    const crumbs: Crumb[] = [
      { href: '/caf%C3%A9', label: 'Café', current: false, params: {} },
      { href: '/caf%C3%A9/menu', label: 'Menu', current: true, params: {} },
    ]
    expect(
      toJsonLd({ crumbs, baseUrl: FIXTURE_BASE_URL }).itemListElement[0].item,
    ).toBe('https://example.com/caf%C3%A9')
  })

  it('throws BASE_URL_REQUIRED without a baseUrl, naming the opt-out', () => {
    expect(() =>
      toJsonLd({
        crumbs: FIXTURE_CRUMBS,
        baseUrl: undefined as unknown as string,
      }),
    ).toThrow(/set jsonLd to false/)
    expect(
      codeOf(() =>
        toJsonLd({
          crumbs: FIXTURE_CRUMBS,
          baseUrl: undefined as unknown as string,
        }),
      ),
    ).toBe('BASE_URL_REQUIRED')
  })

  it.each([
    'example.com',
    'localhost:3000',
    '/relative',
    'ftp://example.com',
    '',
  ])('throws INVALID_BASE_URL for %j', baseUrl => {
    expect(codeOf(() => toJsonLd({ crumbs: FIXTURE_CRUMBS, baseUrl }))).toBe(
      'INVALID_BASE_URL',
    )
  })
})

describe('serializeJsonLd', () => {
  const hostile: Crumb[] = [
    { href: '/?a=1&b=2', label: '</script><b>&', current: false, params: {} },
    { href: '/x', label: 'Line\u2028break', current: true, params: {} },
  ]
  const output = serializeJsonLd(
    toJsonLd({ crumbs: hostile, baseUrl: FIXTURE_BASE_URL }),
  )

  it('cannot close the script tag', () => {
    expect(output).not.toContain('</script')
    expect(output).not.toContain('<')
    expect(output).toContain('\\u003c')
  })

  it('never uses HTML entities, which would corrupt query strings', () => {
    expect(output).not.toContain('&amp;')
    expect(output).toContain('\\u0026')
  })

  it('escapes the Unicode line terminators', () => {
    expect(output).not.toContain('\u2028')
    expect(output).toContain('\\u2028')
  })

  it('round-trips through JSON.parse unchanged', () => {
    const parsed = JSON.parse(output)
    expect(parsed.itemListElement[0].name).toBe('</script><b>&')
    expect(parsed.itemListElement[0].item).toBe('https://example.com/?a=1&b=2')
    expect(parsed.itemListElement[1].name).toBe('Line\u2028break')
  })
})
