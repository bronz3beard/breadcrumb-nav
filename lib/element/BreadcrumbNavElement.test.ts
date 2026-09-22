// @vitest-environment jsdom
import axe from 'axe-core'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { defineRoutes } from '../core/build.js'
import { DEFAULT_CLASSES } from '../core/classes.js'
import type { BreadcrumbError } from '../core/errors.js'
import {
  BreadcrumbNavElement,
  defineBreadcrumbNav,
} from './BreadcrumbNavElement.js'
import {
  FIXTURE_BASE_URL,
  FIXTURE_JSON_LD,
  FIXTURE_NAV_HTML,
  FIXTURE_SCRIPT_HTML,
  jsonLdIn,
} from '../test/fixture.js'

beforeAll(() => defineBreadcrumbNav())
afterEach(() => {
  document.body.replaceChildren()
  history.replaceState(null, '', '/')
})

/** Creates a connected element. Attributes are set before it is attached, as HTML would. */
const mount = (
  attributes: Record<string, string> = {},
  properties: Partial<BreadcrumbNavElement> = {},
): BreadcrumbNavElement => {
  const el = document.createElement('breadcrumb-nav') as BreadcrumbNavElement
  for (const [name, value] of Object.entries({
    'base-url': FIXTURE_BASE_URL,
    ...attributes,
  })) {
    el.setAttribute(name, value)
  }
  Object.assign(el, properties)
  document.body.append(el)
  return el
}

const labelsOf = (el: Element) =>
  [...el.querySelectorAll('li')].map(li => li.textContent)

describe('<breadcrumb-nav> markup', () => {
  it('renders the shared markup fixture and the JSON-LD script into light DOM', () => {
    const el = mount(
      { path: '/forms/42' },
      { pathLabels: { '/forms/42': 'Expense claim' } },
    )
    expect(el.innerHTML).toBe(FIXTURE_NAV_HTML + FIXTURE_SCRIPT_HTML)
    expect(el.shadowRoot).toBeNull()
  })

  it('emits JSON-LD by default that matches the visible trail', () => {
    const el = mount(
      { path: '/forms/42' },
      { pathLabels: { '/forms/42': 'Expense claim' } },
    )
    expect(jsonLdIn(el.innerHTML)).toEqual(FIXTURE_JSON_LD)
  })

  it('is a navigation landmark with an ordered list, real links in order, and aria-current on the last item', () => {
    const el = mount({ path: '/a/b' })
    const nav = el.querySelector('nav')
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')
    expect(el.querySelector('ol')).not.toBeNull()
    const links = [...el.querySelectorAll('a')]
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/', '/a'])
    expect(links.every(a => a.tabIndex === 0)).toBe(true)
    const current = el.querySelector('[aria-current="page"]')
    expect(current?.tagName).toBe('SPAN')
    expect(current?.textContent).toBe('B')
    expect(
      [...el.querySelectorAll('[data-crumb="separator"]')].every(
        s => s.getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true)
  })

  it('has no accessibility violations', async () => {
    const el = mount({ path: '/a/b/c' })
    const results = await axe.run(el, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(results.violations).toEqual([])
  })

  it('never uses innerHTML: a hostile label is text in the markup and intact in the JSON-LD', () => {
    const el = mount(
      { path: '/x/y' },
      { pathLabels: { '/x': '<img src=x onerror=alert(1)>&' } },
    )
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('a[href="/x"]')?.textContent).toBe(
      '<img src=x onerror=alert(1)>&',
    )
    expect(jsonLdIn(el.innerHTML)?.itemListElement[1].name).toBe(
      '<img src=x onerror=alert(1)>&',
    )
  })
})

describe('attributes and properties', () => {
  it('re-renders when an observed attribute changes', () => {
    const el = mount({ path: '/a' })
    expect(labelsOf(el)).toEqual(['Home/', 'A'])
    el.setAttribute('path', '/a/b')
    expect(labelsOf(el)).toEqual(['Home/', 'A/', 'B'])
  })

  it('accepts routes and labels as properties', () => {
    const routes = defineRoutes([
      { path: '/form-settings' },
      { path: '/forms', parent: '/form-settings' },
      { path: '/forms/:id' },
    ])
    const el = mount({ path: '/forms/42' }, { routes })
    el.labels = { '/forms/:id': ({ params }) => `Form ${params.id}` }
    expect(labelsOf(el)).toEqual([
      'Home/',
      'Form Settings/',
      'Forms/',
      'Form 42',
    ])
  })

  it('maps home, base-path, separator, strict, trailing-slash and nav-label', () => {
    const el = mount({
      path: '/app/reports/2024/summary',
      'base-path': '/app',
      'home-label': 'Dashboard',
      separator: '›',
      'trailing-slash': 'always',
      'nav-label': 'Where you are',
    })
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Where you are',
    )
    expect(labelsOf(el)).toEqual(['Dashboard›', 'Reports›', '2024›', 'Summary'])
    // Only the bare site root stays "/"; a base path gets the trailing slash like any other page.
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/app/')
    expect(el.querySelectorAll('a')[1].getAttribute('href')).toBe(
      '/app/reports/',
    )
    el.setAttribute('home', 'false')
    expect(labelsOf(el)[0]).toBe('Reports›')
    el.routes = defineRoutes([{ path: '/app/reports' }])
    el.setAttribute('strict', '')
    expect(labelsOf(el)).toEqual(['Reports›', 'Summary'])
  })

  it('merges classNames and honours unstyled, keeping the data hooks', () => {
    const el = mount({ path: '/a/b' }, { classNames: { nav: 'mine' } })
    expect(el.querySelector('nav')?.className).toBe(
      `${DEFAULT_CLASSES.nav} mine`,
    )
    el.setAttribute('unstyled', '')
    expect(el.querySelector('nav')?.className).toBe('mine')
    expect(el.querySelector('ol')?.hasAttribute('class')).toBe(false)
    for (const part of [
      'nav',
      'list',
      'item',
      'link',
      'current',
      'separator',
    ]) {
      expect(el.querySelector(`[data-crumb="${part}"]`)).not.toBeNull()
    }
  })

  it('omits the JSON-LD with json-ld="false", and then needs no base-url', () => {
    const el = document.createElement('breadcrumb-nav') as BreadcrumbNavElement
    el.setAttribute('path', '/a/b')
    el.setAttribute('json-ld', 'false')
    document.body.append(el)
    expect(el.querySelector('script')).toBeNull()
    expect(el.querySelector('nav')).not.toBeNull()
  })

  it('reports BASE_URL_REQUIRED on connect when base-url is missing, even on the root page', () => {
    // An exception in connectedCallback is reported to window as an error event, not thrown to append().
    for (const path of ['/a/b', '/']) {
      const reported: unknown[] = []
      const capture = (event: ErrorEvent) => {
        reported.push(event.error)
        event.preventDefault()
      }
      window.addEventListener('error', capture)
      const el = document.createElement('breadcrumb-nav')
      el.setAttribute('path', path)
      document.body.append(el)
      window.removeEventListener('error', capture)
      expect(reported).toHaveLength(1)
      expect((reported[0] as BreadcrumbError).code).toBe('BASE_URL_REQUIRED')
      expect(el.innerHTML).toBe('')
    }
  })

  it('renders nothing for a one-crumb trail unless render-on-root is set', () => {
    const el = mount({ path: '/' })
    expect(el.innerHTML).toBe('')
    el.setAttribute('render-on-root', '')
    expect(el.querySelector('[aria-current="page"]')?.textContent).toBe('Home')
  })
})

describe('following navigation', () => {
  it('reads location.pathname when there is no path attribute', () => {
    history.pushState(null, '', '/docs/guides')
    expect(labelsOf(mount())).toEqual(['Home/', 'Docs/', 'Guides'])
  })

  it('does not notice pushState alone, but refresh() and popstate re-render', () => {
    history.pushState(null, '', '/one')
    const el = mount()
    expect(labelsOf(el)).toEqual(['Home/', 'One'])
    history.pushState(null, '', '/two')
    expect(labelsOf(el)).toEqual(['Home/', 'One'])
    el.refresh()
    expect(labelsOf(el)).toEqual(['Home/', 'Two'])
    history.pushState(null, '', '/three')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(labelsOf(el)).toEqual(['Home/', 'Three'])
  })

  it('uses the Navigation API where it exists and renders the new URL, not the old one', () => {
    const navigation = new EventTarget()
    ;(window as { navigation?: EventTarget }).navigation = navigation
    try {
      history.pushState(null, '', '/before')
      const el = mount()
      history.pushState(null, '', '/after')
      navigation.dispatchEvent(new Event('navigatesuccess'))
      expect(labelsOf(el)).toEqual(['Home/', 'After'])
      history.pushState(null, '', '/ignored')
      window.dispatchEvent(new PopStateEvent('popstate'))
      expect(labelsOf(el)).toEqual(['Home/', 'After'])
    } finally {
      delete (window as { navigation?: EventTarget }).navigation
    }
  })

  it('stops listening once disconnected', () => {
    history.pushState(null, '', '/one')
    const el = mount()
    el.remove()
    history.pushState(null, '', '/two')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(labelsOf(el)).toEqual(['Home/', 'One'])
  })
})

describe('defineBreadcrumbNav', () => {
  it('is a no-op when called again', () => {
    expect(() => defineBreadcrumbNav()).not.toThrow()
    expect(customElements.get('breadcrumb-nav')).toBe(BreadcrumbNavElement)
  })

  it('registers under another tag name when asked', () => {
    defineBreadcrumbNav('site-crumbs')
    const el = document.createElement('site-crumbs') as BreadcrumbNavElement
    el.setAttribute('path', '/a/b')
    el.setAttribute('base-url', FIXTURE_BASE_URL)
    document.body.append(el)
    expect(el).toBeInstanceOf(BreadcrumbNavElement)
    expect(labelsOf(el)).toEqual(['Home/', 'A/', 'B'])
  })
})
