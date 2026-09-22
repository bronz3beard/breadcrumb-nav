// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Breadcrumbs } from './next.js'
import { FIXTURE_BASE_URL, jsonLdIn } from './test/fixture.js'

vi.mock('next/navigation', () => ({ usePathname: () => '/forms/42' }))
vi.mock('next/link', () => ({
  default: (props: ComponentProps<'a'>) => <a data-mocked-link {...props} />,
}))

afterEach(cleanup)

describe('breadcrumb-nav/next', () => {
  it('reads the path from usePathname()', () => {
    render(<Breadcrumbs baseUrl={FIXTURE_BASE_URL} />)
    expect(
      screen.getAllByRole('listitem').map(item => item.textContent),
    ).toEqual(['Home/', 'Forms/', '42'])
  })

  it('renders ancestors with next/link, keeping the href, classes and data hook', () => {
    const { container } = render(<Breadcrumbs baseUrl={FIXTURE_BASE_URL} />)
    const links = container.querySelectorAll('a[data-mocked-link]')
    expect([...links].map(link => link.getAttribute('href'))).toEqual([
      '/',
      '/forms',
    ])
    expect(links[0].getAttribute('data-crumb')).toBe('link')
    expect(links[0].className).not.toBe('')
  })

  it('emits JSON-LD by default', () => {
    const { container } = render(<Breadcrumbs baseUrl={FIXTURE_BASE_URL} />)
    expect(jsonLdIn(container.innerHTML)?.itemListElement).toHaveLength(3)
  })

  it('lets an explicit path override the router', () => {
    render(<Breadcrumbs path="/settings/profile" baseUrl={FIXTURE_BASE_URL} />)
    expect(screen.getByText('Profile').getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('lets renderLink override next/link', () => {
    const { container } = render(
      <Breadcrumbs
        baseUrl={FIXTURE_BASE_URL}
        renderLink={({ href, children }) => (
          <a href={href} data-custom>
            {children}
          </a>
        )}
      />,
    )
    expect(container.querySelectorAll('a[data-custom]')).toHaveLength(2)
    expect(container.querySelectorAll('a[data-mocked-link]')).toHaveLength(0)
  })

  it('still requires baseUrl unless jsonLd is false', () => {
    // @ts-expect-error baseUrl is required unless jsonLd is false
    expect(() => render(<Breadcrumbs />)).toThrow(/baseUrl is required/)
    cleanup()
    const { container } = render(<Breadcrumbs jsonLd={false} />)
    expect(container.querySelector('script')).toBeNull()
  })
})
