import { describe, expect, it } from 'vitest'
import { DEFAULT_CLASSES } from './classes.js'
import { BreadcrumbError } from './errors.js'
import { renderBreadcrumbsHtml } from './html.js'
import {
  FIXTURE_BASE_URL,
  FIXTURE_CRUMBS,
  FIXTURE_NAV_HTML,
  FIXTURE_SCRIPT_HTML,
  jsonLdIn,
} from '../test/fixture.js'
import type { Crumb } from './types.js'

const render = (
  overrides: Partial<Parameters<typeof renderBreadcrumbsHtml>[0]> = {},
) =>
  renderBreadcrumbsHtml({
    crumbs: FIXTURE_CRUMBS,
    baseUrl: FIXTURE_BASE_URL,
    ...overrides,
  })

describe('renderBreadcrumbsHtml', () => {
  it('renders the shared markup fixture followed by the JSON-LD script', () => {
    expect(render()).toBe(FIXTURE_NAV_HTML + FIXTURE_SCRIPT_HTML)
  })

  it('emits JSON-LD by default whose names match the visible labels', () => {
    const jsonLd = jsonLdIn(render())
    expect(jsonLd?.itemListElement.map(item => item.name)).toEqual(
      FIXTURE_CRUMBS.map(crumb => crumb.label),
    )
  })

  it('omits the script, and needs no baseUrl, when jsonLd is false', () => {
    const html = renderBreadcrumbsHtml({
      crumbs: FIXTURE_CRUMBS,
      jsonLd: false,
    })
    expect(html).toBe(FIXTURE_NAV_HTML)
    expect(jsonLdIn(html)).toBeUndefined()
  })

  it('throws BASE_URL_REQUIRED when JSON-LD is on and baseUrl is missing, even on the root page', () => {
    const root = FIXTURE_CRUMBS.slice(0, 1)
    for (const crumbs of [FIXTURE_CRUMBS, root]) {
      let error: unknown
      try {
        renderBreadcrumbsHtml({ crumbs })
      } catch (caught) {
        error = caught
      }
      expect((error as BreadcrumbError).code).toBe('BASE_URL_REQUIRED')
    }
  })

  it('renders nothing for a one-crumb trail unless renderOnRoot is set', () => {
    const root = FIXTURE_CRUMBS.slice(0, 1).map(c => ({ ...c, current: true }))
    expect(render({ crumbs: root })).toBe('')
    const forced = render({ crumbs: root, renderOnRoot: true })
    expect(forced).toContain('aria-current="page"')
    expect(jsonLdIn(forced)?.itemListElement).toHaveLength(1)
  })

  it('renders nothing for an empty trail', () => {
    expect(render({ crumbs: [] })).toBe('')
  })

  it('escapes labels, hrefs, the separator and the aria-label', () => {
    const crumbs: Crumb[] = [
      { href: '/?a=1&b="2"', label: '<b>&"', current: false, params: {} },
      { href: '/x', label: 'X', current: true, params: {} },
    ]
    const html = render({ crumbs, separator: '<>', ariaLabel: 'Path "here"' })
    expect(html).toContain('href="/?a=1&amp;b=&quot;2&quot;"')
    expect(html).toContain('>&lt;b&gt;&amp;&quot;</a>')
    expect(html).toContain('data-crumb="separator">&lt;&gt;</span>')
    expect(html).toContain('aria-label="Path &quot;here&quot;"')
    expect(html).not.toContain('<b>')
  })

  it('hides separators from assistive technology and puts none after the current page', () => {
    const html = render()
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2)
    expect(html).toMatch(
      /aria-current="page">Expense claim<\/span><\/li><\/ol>/,
    )
  })

  it('merges classNames onto the defaults and drops the defaults with unstyled', () => {
    expect(render({ classNames: { link: 'mine' } })).toContain(
      `class="${DEFAULT_CLASSES.link} mine"`,
    )
    const unstyled = render({
      unstyled: true,
      classNames: { nav: 'only-mine' },
    })
    expect(unstyled).toContain(
      '<nav aria-label="Breadcrumb" class="only-mine" data-crumb="nav">',
    )
    expect(unstyled).toContain('<ol data-crumb="list">')
    expect(unstyled).not.toContain(DEFAULT_CLASSES.link)
  })

  it('keeps the data-crumb hooks when unstyled, for consumer CSS', () => {
    const html = render({ unstyled: true })
    for (const part of [
      'nav',
      'list',
      'item',
      'link',
      'current',
      'separator',
    ]) {
      expect(html).toContain(`data-crumb="${part}"`)
    }
  })
})
