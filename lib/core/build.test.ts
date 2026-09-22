import { describe, expect, it } from 'vitest'
import { buildBreadcrumbs } from './build.js'
import { BreadcrumbError } from './errors.js'

const labels = (path: string) =>
  buildBreadcrumbs({ path }).map(crumb => crumb.label)
const hrefs = (path: string) =>
  buildBreadcrumbs({ path }).map(crumb => crumb.href)

describe('buildBreadcrumbs without routes', () => {
  it('returns only Home for the root, marked current', () => {
    expect(buildBreadcrumbs({ path: '/' })).toEqual([
      { href: '/', label: 'Home', current: true, params: {} },
    ])
  })

  it('makes one crumb per segment with Home first and the last one current', () => {
    const crumbs = buildBreadcrumbs({ path: '/forms/expense-claims' })
    expect(crumbs).toEqual([
      { href: '/', label: 'Home', current: false, params: {} },
      { href: '/forms', label: 'Forms', current: false, params: {} },
      {
        href: '/forms/expense-claims',
        label: 'Expense Claims',
        current: true,
        params: {},
      },
    ])
  })

  it('handles any depth', () => {
    const path = '/a/b/c/d/e/f'
    expect(hrefs(path)).toEqual([
      '/',
      '/a',
      '/a/b',
      '/a/b/c',
      '/a/b/c/d',
      '/a/b/c/d/e',
      '/a/b/c/d/e/f',
    ])
    const crumbs = buildBreadcrumbs({ path })
    expect(crumbs.filter(crumb => crumb.current)).toHaveLength(1)
    expect(crumbs.at(-1)?.current).toBe(true)
  })

  it('ignores the query string and hash', () => {
    expect(hrefs('/docs/guides?page=2#intro')).toEqual([
      '/',
      '/docs',
      '/docs/guides',
    ])
  })

  it('keeps encoded hrefs as written and decodes them for labels', () => {
    const [, crumb] = buildBreadcrumbs({ path: '/caf%C3%A9' })
    expect(crumb).toMatchObject({ href: '/caf%C3%A9', label: 'Café' })
  })

  it('shows a numeric or uuid segment as it is when nothing names it', () => {
    expect(labels('/forms/42')).toEqual(['Home', 'Forms', '42'])
  })

  it('throws INVALID_PATH for a relative path', () => {
    expect(() => buildBreadcrumbs({ path: 'forms' })).toThrowError(
      BreadcrumbError,
    )
  })
})

describe('home', () => {
  it('can be relabelled and repointed', () => {
    const [home] = buildBreadcrumbs({
      path: '/reports',
      home: { label: 'Dashboard', href: '/app' },
    })
    expect(home).toMatchObject({ href: '/app', label: 'Dashboard' })
  })

  it('can be removed, leaving the first segment as the first crumb', () => {
    expect(buildBreadcrumbs({ path: '/reports/2024', home: false })).toEqual([
      { href: '/reports', label: 'Reports', current: false, params: {} },
      { href: '/reports/2024', label: '2024', current: true, params: {} },
    ])
  })

  it('returns an empty trail for the root when home is removed', () => {
    expect(buildBreadcrumbs({ path: '/', home: false })).toEqual([])
  })
})

describe('basePath', () => {
  it('starts the trail below the base and points Home at it', () => {
    expect(
      buildBreadcrumbs({
        path: '/fleet-erm/organisation/sites',
        basePath: '/fleet-erm',
      }),
    ).toEqual([
      { href: '/fleet-erm', label: 'Home', current: false, params: {} },
      {
        href: '/fleet-erm/organisation',
        label: 'Organisation',
        current: false,
        params: {},
      },
      {
        href: '/fleet-erm/organisation/sites',
        label: 'Sites',
        current: true,
        params: {},
      },
    ])
  })

  it('treats the base itself as the root', () => {
    expect(
      buildBreadcrumbs({ path: '/fleet-erm', basePath: '/fleet-erm' }),
    ).toEqual([
      { href: '/fleet-erm', label: 'Home', current: true, params: {} },
    ])
  })

  it('throws INVALID_PATH when the path is outside the base', () => {
    expect(() =>
      buildBreadcrumbs({ path: '/other', basePath: '/fleet-erm' }),
    ).toThrow(/outside basePath/)
  })
})

describe('trailingSlash', () => {
  it('defaults to never', () => {
    expect(hrefs('/docs/guides/')).toEqual(['/', '/docs', '/docs/guides'])
  })

  it('appends a slash to every href below the root when always', () => {
    expect(
      buildBreadcrumbs({ path: '/docs/guides', trailingSlash: 'always' }).map(
        crumb => crumb.href,
      ),
    ).toEqual(['/', '/docs/', '/docs/guides/'])
  })
})

describe('pathLabels', () => {
  it('overrides the label for a matching href', () => {
    expect(
      buildBreadcrumbs({
        path: '/forms/42',
        pathLabels: { '/forms/42': 'Expense claim' },
      }).map(crumb => crumb.label),
    ).toEqual(['Home', 'Forms', 'Expense claim'])
  })

  it('ignores keys for other pages, so one app-wide map works everywhere', () => {
    expect(
      buildBreadcrumbs({
        path: '/forms',
        pathLabels: { '/forms/42': 'Expense claim', '/settings': 'Settings' },
      }).map(crumb => crumb.label),
    ).toEqual(['Home', 'Forms'])
  })

  it('matches keys regardless of trailing slash under either policy', () => {
    expect(
      buildBreadcrumbs({
        path: '/forms',
        pathLabels: { '/forms/': 'All forms' },
      }).at(-1)?.label,
    ).toBe('All forms')
    expect(
      buildBreadcrumbs({
        path: '/forms',
        pathLabels: { '/forms': 'All forms' },
        trailingSlash: 'always',
      }).at(-1)?.label,
    ).toBe('All forms')
  })

  it('can relabel Home', () => {
    expect(
      buildBreadcrumbs({ path: '/forms', pathLabels: { '/': 'Start' } })[0]
        .label,
    ).toBe('Start')
  })

  it('accepts a function that receives the segment and path', () => {
    const [, , crumb] = buildBreadcrumbs({
      path: '/forms/42',
      pathLabels: {
        '/forms/42': ({ segment, path }) => `Form #${segment} (${path})`,
      },
    })
    expect(crumb.label).toBe('Form #42 (/forms/42)')
  })

  it('throws INVALID_PATH for a key that is not a pathname', () => {
    expect(() =>
      buildBreadcrumbs({
        path: '/forms',
        // @ts-expect-error a key without a leading slash is not a path
        pathLabels: { forms: 'Forms' },
      }),
    ).toThrow(/pathLabels key must be a string starting with "\/"/)
  })
})

describe('formatLabel', () => {
  it('replaces the built-in inference and receives the crumb path', () => {
    const crumbs = buildBreadcrumbs({
      path: '/docs/getting-started',
      formatLabel: ({ segment, path }) => `${segment.toUpperCase()}@${path}`,
    })
    expect(crumbs.map(crumb => crumb.label)).toEqual([
      'Home',
      'DOCS@/docs',
      'GETTING-STARTED@/docs/getting-started',
    ])
  })

  it('is not used where a pathLabels entry matches', () => {
    const crumbs = buildBreadcrumbs({
      path: '/docs',
      pathLabels: { '/docs': 'Documentation' },
      formatLabel: () => 'never',
    })
    expect(crumbs[1].label).toBe('Documentation')
  })
})
