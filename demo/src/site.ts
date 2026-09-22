// The fake site the playground navigates. Five levels deep, one id, one page whose parent is not its URL parent,
// and one URL segment with no page of its own.
import { defineRoutes, type Label } from 'breadcrumb-nav/core'

export const BASE_URL = 'https://example.com'

export const routes = defineRoutes([
  { path: '/docs', label: 'Documentation' },
  { path: '/docs/guides/routing/nested/deep' },
  { path: '/forms', parent: '/settings/forms-admin' },
  { path: '/forms/:id', label: ({ params }) => `Form ${params.id}` },
  { path: '/settings' },
  { path: '/settings/forms-admin', label: 'Forms admin' },
  { path: '/internal', hidden: true },
  { path: '/internal/question/:id' },
])

export const pages: { path: string; note: string }[] = [
  { path: '/', note: 'the root: nothing renders' },
  { path: '/docs', note: 'a declared label' },
  {
    path: '/docs/guides/routing/nested/deep',
    note: 'five levels, labels inferred from the URL',
  },
  { path: '/forms', note: 'a declared parent: the trail leaves the URL' },
  {
    path: '/forms/42',
    note: 'an id named by a label function, and by pathLabels',
  },
  { path: '/internal/question/7', note: 'a hidden ancestor' },
  {
    path: '/annual_report/userSettings/caf%C3%A9',
    note: 'snake_case, camelCase, percent-encoding',
  },
]

export const defaultPathLabels: Record<`/${string}`, Label> = {
  '/forms/42': 'Expense claim',
}

export const snippets = {
  react: `import { Breadcrumbs } from 'breadcrumb-nav'
import { routes } from './routes'

<Breadcrumbs
  path={pathname}                 // from your router
  baseUrl="https://example.com"
  routes={routes}
  pathLabels={{ '/forms/42': 'Expense claim' }}
/>`,
  next: `// app/layout.tsx
import { Breadcrumbs } from 'breadcrumb-nav/next'
import { routes } from '@/lib/routes'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Breadcrumbs baseUrl="https://example.com" routes={routes} />
        {children}
      </body>
    </html>
  )
}`,
  element: `import { defineBreadcrumbNav } from 'breadcrumb-nav/element'
import { routes } from './routes'

defineBreadcrumbNav()
const el = document.querySelector('breadcrumb-nav')
el.routes = routes
el.pathLabels = { '/forms/42': 'Expense claim' }

<!-- reads location.pathname; set path="…" to control it -->
<breadcrumb-nav base-url="https://example.com"></breadcrumb-nav>`,
  html: `import { buildBreadcrumbs, renderBreadcrumbsHtml } from 'breadcrumb-nav/core'
import { routes } from './routes'

const crumbs = buildBreadcrumbs({ path: request.path, routes })
const html = renderBreadcrumbsHtml({ crumbs, baseUrl: 'https://example.com' })`,
  routes: `import { defineRoutes } from 'breadcrumb-nav'

export const routes = defineRoutes([
  { path: '/docs', label: 'Documentation' },
  { path: '/forms', parent: '/settings/forms-admin' },
  { path: '/forms/:id', label: ({ params }) => \`Form \${params.id}\` },
  { path: '/settings/forms-admin', label: 'Forms admin' },
  { path: '/internal', hidden: true },
])`,
  tailwind: `/* your global stylesheet */
@import 'tailwindcss';
@source '../node_modules/breadcrumb-nav/dist';`,
  plain: `import 'breadcrumb-nav/styles.css'

<Breadcrumbs unstyled … />`,
}
