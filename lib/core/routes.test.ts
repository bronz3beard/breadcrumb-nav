import { describe, expect, it } from 'vitest'
import { buildBreadcrumbs, defineRoutes } from './build.js'
import { BreadcrumbError } from './errors.js'
import type { RouteDef } from './types.js'

const trail = (
  path: string,
  options: Omit<Parameters<typeof buildBreadcrumbs>[0], 'path'> = {},
) =>
  buildBreadcrumbs({ path, ...options }).map(
    crumb => `${crumb.label}@${crumb.href}${crumb.current ? '*' : ''}`,
  )

const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn()
  } catch (error) {
    return (error as BreadcrumbError).code
  }
  return undefined
}

describe('route patterns', () => {
  const routes = defineRoutes([
    { path: '/docs', label: 'Documentation' },
    { path: '/docs/:slug' },
    { path: '/docs/[slug]/[section]' },
    { path: '/files/[...rest]' },
    { path: '/search/*' },
    { path: '/docs/faq', label: 'FAQ' },
  ])

  it('applies a declared label to the matching page', () => {
    expect(trail('/docs', { routes })).toEqual([
      'Home@/',
      'Documentation@/docs*',
    ])
  })

  it('matches :param and [param] and exposes the value as a param and as the label', () => {
    const crumbs = buildBreadcrumbs({
      path: '/docs/getting-started/install',
      routes,
    })
    expect(crumbs.at(-2)).toMatchObject({
      pattern: '/docs/:slug',
      params: { slug: 'getting-started' },
      label: 'Getting Started',
    })
    expect(crumbs.at(-1)).toMatchObject({
      pattern: '/docs/[slug]/[section]',
      params: { slug: 'getting-started', section: 'install' },
    })
  })

  it('prefers a static segment over a param at the same position', () => {
    expect(trail('/docs/faq', { routes }).at(-1)).toBe('FAQ@/docs/faq*')
  })

  it('matches [...rest] and * to the remainder, joined with slashes', () => {
    expect(
      buildBreadcrumbs({ path: '/files/a/b/c', routes }).at(-1),
    ).toMatchObject({ pattern: '/files/[...rest]', params: { rest: 'a/b/c' } })
    expect(
      buildBreadcrumbs({ path: '/search/x/y', routes }).at(-1),
    ).toMatchObject({ pattern: '/search/*', params: { '*': 'x/y' } })
  })

  it('requires at least one segment for a catch-all', () => {
    expect(
      buildBreadcrumbs({ path: '/files', routes }).at(-1)?.pattern,
    ).toBeUndefined()
  })

  it('rejects a catch-all that is not last', () => {
    expect(codeOf(() => defineRoutes([{ path: '/a/[...x]/b' }]))).toBe(
      'INVALID_PATH',
    )
  })

  it('accepts a plain RouteDef[] without defineRoutes', () => {
    const plain: RouteDef[] = [{ path: '/x', label: 'Ex' }]
    expect(trail('/x', { routes: plain })).toEqual(['Home@/', 'Ex@/x*'])
  })
})

describe('parent chains', () => {
  it('replaces the URL ancestors with the declared parent trail', () => {
    const routes = defineRoutes([
      { path: '/form-settings' },
      { path: '/form/sub-form-types', parent: '/form-settings' },
    ])
    expect(trail('/form/sub-form-types', { routes })).toEqual([
      'Home@/',
      'Form Settings@/form-settings',
      'Sub Form Types@/form/sub-form-types*',
    ])
  })

  it('chains through any number of parents', () => {
    const routes = defineRoutes([
      { path: '/a' },
      { path: '/b', parent: '/a' },
      { path: '/c', parent: '/b' },
      { path: '/d', parent: '/c' },
      { path: '/e', parent: '/d' },
    ])
    expect(trail('/e', { routes })).toEqual([
      'Home@/',
      'A@/a',
      'B@/b',
      'C@/c',
      'D@/d',
      'E@/e*',
    ])
  })

  it('is inherited by pages below a page that declares a parent', () => {
    const routes = defineRoutes([
      { path: '/form-settings' },
      { path: '/forms', parent: '/form-settings' },
      { path: '/forms/:id', label: 'Form' },
    ])
    expect(trail('/forms/42/edit', { routes })).toEqual([
      'Home@/',
      'Form Settings@/form-settings',
      'Forms@/forms',
      'Form@/forms/42',
      'Edit@/forms/42/edit*',
    ])
  })

  it('fills a parent pattern from the page params (an undeclared URL ancestor of the parent is still inferred)', () => {
    const routes = defineRoutes([
      { path: '/orgs/:orgId', label: ({ params }) => `Org ${params.orgId}` },
      { path: '/orgs/:orgId/settings/billing', parent: '/orgs/:orgId' },
    ])
    expect(trail('/orgs/acme/settings/billing', { routes })).toEqual([
      'Home@/',
      'Orgs@/orgs',
      'Org acme@/orgs/acme',
      'Billing@/orgs/acme/settings/billing*',
    ])
  })

  it('throws UNKNOWN_PARENT when the parent needs a param the page lacks', () => {
    const routes = defineRoutes([
      { path: '/orgs/:orgId' },
      { path: '/billing', parent: '/orgs/:orgId' },
    ])
    expect(codeOf(() => buildBreadcrumbs({ path: '/billing', routes }))).toBe(
      'UNKNOWN_PARENT',
    )
  })

  it('throws UNKNOWN_PARENT at definition for an undeclared parent, listing the declared paths', () => {
    expect(() =>
      defineRoutes([
        { path: '/a' },
        { path: '/b', parent: '/typo' } as RouteDef,
      ]),
    ).toThrow(/"\/typo", which is not a declared route\. Declared: \/a, \/b/)
  })

  it('throws PARENT_CYCLE at definition for a loop', () => {
    const looped: RouteDef[] = [
      { path: '/a', parent: '/b' },
      { path: '/b', parent: '/a' },
    ]
    expect(codeOf(() => defineRoutes(looped))).toBe('PARENT_CYCLE')
    expect(codeOf(() => defineRoutes([{ path: '/a', parent: '/a' }]))).toBe(
      'PARENT_CYCLE',
    )
  })

  it('can chain up to Home itself', () => {
    const routes = defineRoutes([
      { path: '/' },
      { path: '/deep/page', parent: '/' },
    ])
    expect(trail('/deep/page', { routes })).toEqual([
      'Home@/',
      'Page@/deep/page*',
    ])
  })
})

describe('hidden and strict', () => {
  const routes = defineRoutes([
    { path: '/internal-training' },
    { path: '/internal-training/question', hidden: true },
    { path: '/internal-training/question/:id' },
  ])

  it('drops a hidden route from the ancestors', () => {
    expect(trail('/internal-training/question/7', { routes })).toEqual([
      'Home@/',
      'Internal Training@/internal-training',
      '7@/internal-training/question/7*',
    ])
  })

  it('still shows a hidden route when it is the current page', () => {
    expect(trail('/internal-training/question', { routes }).at(-1)).toBe(
      'Question@/internal-training/question*',
    )
  })

  it('in strict mode leaves out ancestors that match no route', () => {
    const strictRoutes = defineRoutes([{ path: '/reports' }])
    expect(trail('/reports/2024/q3/summary', { routes: strictRoutes })).toEqual(
      [
        'Home@/',
        'Reports@/reports',
        '2024@/reports/2024',
        'Q3@/reports/2024/q3',
        'Summary@/reports/2024/q3/summary*',
      ],
    )
    expect(
      trail('/reports/2024/q3/summary', { routes: strictRoutes, strict: true }),
    ).toEqual([
      'Home@/',
      'Reports@/reports',
      'Summary@/reports/2024/q3/summary*',
    ])
  })
})

describe('labels', () => {
  const routes = defineRoutes([
    { path: '/forms', label: 'Route label' },
    { path: '/forms/:id' },
  ])

  it('overrides the route label for every page matching the pattern', () => {
    expect(
      trail('/forms/1', { routes, labels: { '/forms': 'All forms' } })[1],
    ).toBe('All forms@/forms')
  })

  it('accepts a function that receives the matched params', () => {
    expect(
      trail('/forms/1', {
        routes,
        labels: { '/forms/:id': ({ params }) => `Form #${params.id}` },
      }).at(-1),
    ).toBe('Form #1@/forms/1*')
  })

  it('ranks pathLabels above labels above the route label above inference', () => {
    const options = {
      routes,
      labels: { '/forms': 'From labels' },
      pathLabels: { '/forms': 'From pathLabels' },
    }
    expect(trail('/forms', options).at(-1)).toBe('From pathLabels@/forms*')
    expect(trail('/forms', { routes, labels: options.labels }).at(-1)).toBe(
      'From labels@/forms*',
    )
    expect(trail('/forms', { routes }).at(-1)).toBe('Route label@/forms*')
    expect(trail('/forms').at(-1)).toBe('Forms@/forms*')
  })

  it('throws LABEL_WITHOUT_ROUTE for a key that is not a declared pattern', () => {
    expect(() =>
      buildBreadcrumbs({
        path: '/forms',
        routes,
        // @ts-expect-error deliberate typo
        labels: { '/form': 'Typo' },
      }),
    ).toThrow(
      /"\/form" is not a declared route\. Declared: \/forms, \/forms\/:id/,
    )
  })

  it('throws LABELS_REQUIRE_ROUTES when labels are given without routes', () => {
    expect(
      codeOf(() =>
        buildBreadcrumbs({
          path: '/forms',
          // @ts-expect-error labels need routes
          labels: { '/forms': 'Forms' },
        }),
      ),
    ).toBe('LABELS_REQUIRE_ROUTES')
  })

  it('lets a route for "/" relabel Home', () => {
    const withRoot = defineRoutes([{ path: '/', label: 'Start' }])
    expect(trail('/x', { routes: withRoot })[0]).toBe('Start@/')
  })
})

describe('the legacy customRoutes() branches, declared as routes', () => {
  // Every `if (path === …)` branch of the old customRoutesFunction.js, expressed as parent/label/hidden
  // declarations under the old app's base path. The expected trails are what the old component produced.
  const base = '/fleet-erm'
  const routes = defineRoutes([
    { path: `${base}/risk-management` },
    { path: `${base}/organisation` },
    { path: `${base}/form-settings` },
    { path: `${base}/sites` },
    { path: `${base}/internal-training` },
    // 1
    { path: `${base}/settings`, parent: `${base}/risk-management` },
    // 3, 2, 4
    { path: `${base}/corporate-sections`, parent: `${base}/organisation` },
    { path: `${base}/corporate-sections/:id`, hidden: true },
    // 5
    { path: `${base}/site`, hidden: true },
    { path: `${base}/site/:id`, hidden: true },
    { path: `${base}/site/:id/questions`, parent: `${base}/sites` },
    // 6
    { path: `${base}/internal-training/question`, hidden: true },
    // 7, 8
    { path: `${base}/forms`, parent: `${base}/form-settings` },
    { path: `${base}/forms/:id`, label: 'Form' },
    // 9, 10
    { path: `${base}/form/sub-form-types`, parent: `${base}/form-settings` },
    { path: `${base}/form/sub-form-types/:id`, label: 'Sub type' },
    // 11
    {
      path: `${base}/internal-training-questionnaire/:id`,
      parent: `${base}/internal-training`,
    },
    // 12
    { path: `${base}/risk-areas`, parent: `${base}/settings` },
    { path: `${base}/risk-categories`, parent: `${base}/settings` },
    // 13
    { path: `${base}/form-admin-view`, parent: `${base}/form-settings` },
    { path: `${base}/form-admin-view/form`, hidden: true },
    // 14
    { path: `${base}/risk-register-list`, parent: `${base}/risk-management` },
    // 15
    { path: `${base}/audit-menu`, parent: `${base}/organisation` },
    { path: `${base}/positions`, parent: `${base}/organisation` },
  ])
  const legacy = (path: string) =>
    buildBreadcrumbs({
      path: `${base}${path}`,
      routes,
      basePath: base,
      home: { label: 'Admin Home' },
    })
      .map(crumb => crumb.label)
      .slice(1)

  it.each([
    ['/settings', ['Risk Management', 'Settings']],
    [
      '/corporate-sections/3/questions',
      ['Organisation', 'Corporate Sections', 'Questions'],
    ],
    ['/corporate-sections', ['Organisation', 'Corporate Sections']],
    [
      '/corporate-sections/3/slides',
      ['Organisation', 'Corporate Sections', 'Slides'],
    ],
    ['/site/9/questions', ['Sites', 'Questions']],
    ['/internal-training/question/5', ['Internal Training', '5']],
    ['/forms', ['Form Settings', 'Forms']],
    ['/forms/12', ['Form Settings', 'Forms', 'Form']],
    ['/form/sub-form-types', ['Form Settings', 'Sub Form Types']],
    ['/form/sub-form-types/4', ['Form Settings', 'Sub Form Types', 'Sub type']],
    ['/internal-training-questionnaire/8', ['Internal Training', '8']],
    ['/risk-areas', ['Risk Management', 'Settings', 'Risk Areas']],
    ['/risk-categories', ['Risk Management', 'Settings', 'Risk Categories']],
    ['/form-admin-view', ['Form Settings', 'Form Admin View']],
    ['/form-admin-view/form/2', ['Form Settings', 'Form Admin View', '2']],
    ['/risk-register-list', ['Risk Management', 'Risk Register List']],
    ['/audit-menu', ['Organisation', 'Audit Menu']],
    ['/positions', ['Organisation', 'Positions']],
    ['/somewhere-else', ['Somewhere Else']],
  ])('%s → %j', (path, expected) => {
    expect(legacy(path)).toEqual(expected)
  })

  it('links every ancestor to its real page under the base path', () => {
    expect(legacy('/risk-areas')).toHaveLength(3)
    const crumbs = buildBreadcrumbs({
      path: `${base}/risk-areas`,
      routes,
      basePath: base,
    })
    expect(crumbs.map(crumb => crumb.href)).toEqual([
      `${base}`,
      `${base}/risk-management`,
      `${base}/settings`,
      `${base}/risk-areas`,
    ])
  })
})
