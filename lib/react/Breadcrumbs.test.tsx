// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_CLASSES } from '../core/classes.js'
import { defineRoutes } from '../core/build.js'
import { BreadcrumbError } from '../core/errors.js'
import { BreadcrumbJsonLd } from './BreadcrumbJsonLd.js'
import { Breadcrumbs } from './Breadcrumbs.js'
import {
  FIXTURE_BASE_URL,
  FIXTURE_CRUMBS,
  FIXTURE_JSON_LD,
  jsonLdIn,
} from '../test/fixture.js'

afterEach(cleanup)

const renderTrail = (
  extra: Partial<React.ComponentProps<typeof Breadcrumbs>> = {},
) =>
  render(
    <Breadcrumbs
      path="/forms/42"
      pathLabels={{ '/forms/42': 'Expense claim' }}
      baseUrl={FIXTURE_BASE_URL}
      {...(extra as object)}
    />,
  )

describe('Breadcrumbs markup and accessibility', () => {
  it('is a navigation landmark named "Breadcrumb" containing an ordered list', () => {
    renderTrail()
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav.tagName).toBe('NAV')
    const list = within(nav).getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  })

  it('links every ancestor with a real href, in trail order, each reachable by Tab', () => {
    renderTrail()
    const links = screen.getAllByRole('link')
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/',
      '/forms',
    ])
    expect(links.map(link => link.textContent)).toEqual(['Home', 'Forms'])
    for (const link of links)
      expect((link as HTMLAnchorElement).tabIndex).toBe(0)
  })

  it('shows the current page last, as text with aria-current="page", not as a link', () => {
    renderTrail()
    const current = screen.getByText('Expense claim')
    expect(current.tagName).toBe('SPAN')
    expect(current.getAttribute('aria-current')).toBe('page')
    expect(screen.queryByRole('link', { name: 'Expense claim' })).toBeNull()
    const items = screen.getAllByRole('listitem')
    expect(items.at(-1)?.contains(current)).toBe(true)
  })

  it('hides separators from assistive technology', () => {
    const { container } = renderTrail()
    const separators = container.querySelectorAll('[data-crumb="separator"]')
    expect(separators).toHaveLength(2)
    for (const separator of separators) {
      expect(separator.getAttribute('aria-hidden')).toBe('true')
    }
    // Nothing outside the hidden separators reads as "/".
    expect(
      screen.queryAllByText('/', { ignore: '[aria-hidden="true"]' }),
    ).toEqual([])
  })

  it('has no accessibility violations', async () => {
    const { container } = renderTrail()
    const results = await axe.run(container, {
      // Needs a real layout engine; jsdom has none.
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(results.violations).toEqual([])
  })

  it('lets the accessible name be translated', () => {
    renderTrail({ 'aria-label': 'Fil d’Ariane' })
    expect(
      screen.getByRole('navigation', { name: 'Fil d’Ariane' }),
    ).toBeTruthy()
  })
})

describe('JSON-LD', () => {
  it('is emitted by default and matches the visible trail', () => {
    const { container } = renderTrail()
    expect(jsonLdIn(container.innerHTML)).toEqual(FIXTURE_JSON_LD)
  })

  it('is not emitted with jsonLd={false}, and baseUrl is then optional', () => {
    const { container } = render(
      <Breadcrumbs path="/forms/42" jsonLd={false} />,
    )
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByRole('navigation')).toBeTruthy()
  })

  it('throws BASE_URL_REQUIRED when baseUrl is missing without opting out', () => {
    let error: unknown
    try {
      // @ts-expect-error baseUrl is required unless jsonLd is false
      render(<Breadcrumbs path="/forms/42" />)
    } catch (caught) {
      error = caught
    }
    expect((error as BreadcrumbError).code).toBe('BASE_URL_REQUIRED')
  })

  it('can be placed separately with <BreadcrumbJsonLd>', () => {
    const { container } = render(
      <BreadcrumbJsonLd crumbs={FIXTURE_CRUMBS} baseUrl={FIXTURE_BASE_URL} />,
    )
    expect(jsonLdIn(container.innerHTML)).toEqual(FIXTURE_JSON_LD)
  })
})

describe('rendering options', () => {
  it('renders nothing for the site root unless renderOnRoot is set', () => {
    const { container } = render(
      <Breadcrumbs path="/" baseUrl={FIXTURE_BASE_URL} />,
    )
    expect(container.innerHTML).toBe('')
    cleanup()
    render(<Breadcrumbs path="/" baseUrl={FIXTURE_BASE_URL} renderOnRoot />)
    expect(screen.getByText('Home').getAttribute('aria-current')).toBe('page')
  })

  it('accepts a custom separator node', () => {
    renderTrail({ separator: <svg data-testid="chevron" /> })
    expect(screen.getAllByTestId('chevron')).toHaveLength(2)
  })

  it('swaps the anchor for renderLink, passing href, className, children and the data hook', () => {
    renderTrail({
      renderLink: ({ href, className, children, ...rest }) => (
        <a
          href={`/app${href}`}
          className={className}
          data-testid="custom"
          {...rest}
        >
          {children}
        </a>
      ),
    })
    const custom = screen.getAllByTestId('custom')
    expect(custom.map(link => link.getAttribute('href'))).toEqual([
      '/app/',
      '/app/forms',
    ])
    expect(custom[0].className).toBe(DEFAULT_CLASSES.link)
    expect(custom[0].getAttribute('data-crumb')).toBe('link')
  })

  it('merges classNames onto the defaults and drops them with unstyled, keeping the data hooks', () => {
    const { container } = renderTrail({ classNames: { nav: 'mine' } })
    expect(container.querySelector('nav')?.className).toBe(
      `${DEFAULT_CLASSES.nav} mine`,
    )
    cleanup()
    const unstyled = renderTrail({
      unstyled: true,
      classNames: { nav: 'only' },
    })
    expect(unstyled.container.querySelector('nav')?.className).toBe('only')
    expect(unstyled.container.querySelector('ol')?.hasAttribute('class')).toBe(
      false,
    )
    for (const part of [
      'nav',
      'list',
      'item',
      'link',
      'current',
      'separator',
    ]) {
      expect(
        unstyled.container.querySelector(`[data-crumb="${part}"]`),
      ).not.toBeNull()
    }
  })

  it('passes routes and typed labels through to the core', () => {
    const routes = defineRoutes([
      { path: '/form-settings' },
      { path: '/forms', parent: '/form-settings' },
      { path: '/forms/:id' },
    ])
    render(
      <Breadcrumbs
        path="/forms/42"
        routes={routes}
        labels={{ '/forms/:id': ({ params }) => `Form ${params.id}` }}
        baseUrl={FIXTURE_BASE_URL}
      />,
    )
    expect(
      screen.getAllByRole('listitem').map(item => item.textContent),
    ).toEqual(['Home/', 'Form Settings/', 'Forms/', 'Form 42'])
  })
})
