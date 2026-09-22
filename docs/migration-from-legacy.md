# Migrating from the old component

This package replaces an internal React component (`BreadCrumbNavHeader`) that was tied to one app: React Router's
`withRouter`, a hard-coded `/fleet-erm` base path, FontAwesome, SCSS, `localStorage`, and a `customRoutes()`
function that decided each page's parents in a long `if`/`else` chain. Everything it did that was worth keeping is
a declaration now. This page maps the old code to the new, branch by branch.

## Side by side

Old:

```jsx
<BreadCrumbNavHeader path={match.path}>{children}</BreadCrumbNavHeader>
```

New:

```tsx
import { Breadcrumbs } from 'breadcrumb-nav'
import { routes } from './routes'

<Breadcrumbs
  path={location.pathname}
  routes={routes}
  basePath="/fleet-erm"
  home={{ label: 'Admin Home' }}
  baseUrl="https://example.com"
  renderLink={({ href, ...rest }) => <Link to={href} {...rest} />}
/>
```

The home icon, the separator and the colours are styling now: pass `separator`, `classNames` or a `renderLink` that
adds an icon. See [styling](./styling.md).

## The `customRoutes()` branches as routes

Each `if (path === …)` branch of the old function returned a hand-built array of parents. Under the base path, the
same trails come from these declarations (the tests in this repository check every row):

```ts
import { defineRoutes } from 'breadcrumb-nav'

const base = '/fleet-erm'

export const routes = defineRoutes([
  { path: `${base}/risk-management` },
  { path: `${base}/organisation` },
  { path: `${base}/form-settings` },
  { path: `${base}/sites` },
  { path: `${base}/internal-training` },
  { path: `${base}/settings`, parent: `${base}/risk-management` },
  { path: `${base}/corporate-sections`, parent: `${base}/organisation` },
  { path: `${base}/corporate-sections/:id`, hidden: true },
  { path: `${base}/site`, hidden: true },
  { path: `${base}/site/:id`, hidden: true },
  { path: `${base}/site/:id/questions`, parent: `${base}/sites` },
  { path: `${base}/internal-training/question`, hidden: true },
  { path: `${base}/forms`, parent: `${base}/form-settings` },
  { path: `${base}/forms/:id`, label: 'Form' },
  { path: `${base}/form/sub-form-types`, parent: `${base}/form-settings` },
  { path: `${base}/form/sub-form-types/:id`, label: 'Sub type' },
  { path: `${base}/internal-training-questionnaire/:id`, parent: `${base}/internal-training` },
  { path: `${base}/risk-areas`, parent: `${base}/settings` },
  { path: `${base}/risk-categories`, parent: `${base}/settings` },
  { path: `${base}/form-admin-view`, parent: `${base}/form-settings` },
  { path: `${base}/form-admin-view/form`, hidden: true },
  { path: `${base}/risk-register-list`, parent: `${base}/risk-management` },
  { path: `${base}/audit-menu`, parent: `${base}/organisation` },
  { path: `${base}/positions`, parent: `${base}/organisation` },
])
```

| # | Old branch (`path ===`) | Old trail after Home | Declaration that produces it |
| --- | --- | --- | --- |
| 1 | `/settings` | risk-management › settings | `/settings` with `parent: /risk-management` |
| 2 | `/corporate-sections/:id/questions` | organisation › corporate-sections › questions | inherited from `/corporate-sections` (parent `/organisation`); `/corporate-sections/:id` hidden |
| 3 | `/corporate-sections` | organisation › corporate-sections | `parent: /organisation` |
| 4 | `/corporate-sections/:id/slides` | corporate-sections › slides | same as 2 (the old code omitted Organisation here; the new trail includes it, which is the more complete hierarchy) |
| 5 | `/site/:id/questions` | sites › questions | `parent: /sites`; `/site` and `/site/:id` hidden |
| 6 | `/internal-training/question/:id` | internal-training › id | `/internal-training/question` hidden |
| 7 | `/forms` | form-settings › forms | `parent: /form-settings` |
| 8 | `/forms/:id` | form-settings › forms › form | inherited from `/forms`; `label: 'Form'` |
| 9 | `/form/sub-form-types` | form-settings › sub-form-types | `parent: /form-settings` |
| 10 | `/form/sub-form-types/:id` | form-settings › sub-form-types › sub-type | inherited; `label: 'Sub type'` |
| 11 | `/internal-training-questionnaire/:id` | internal-training › internal-training/question › id | `parent: /internal-training`. The old middle crumb linked to a literal `:id`, a broken link; it is dropped |
| 12 | `/risk-areas`, `/risk-categories` | risk-management › settings › … | `parent: /settings`, whose own parent supplies Risk Management |
| 13 | `/form-admin-view`, `/form-admin-view/form/:id` | form-settings › … | `parent: /form-settings`; `/form-admin-view/form` hidden |
| 14 | `/risk-register-list` | risk-management › … | `parent: /risk-management` |
| 15 | `/audit-menu`, `/positions` | organisation › … | `parent: /organisation` |
| 16 | anything else | the page alone | the default: URL ancestors, inferred labels |

Two behaviours changed on purpose. Row 4 now shows Organisation, because the page really is under it. Row 11 loses
a crumb whose link never worked. Every other trail is the same, with proper capitalisation.

## What was dropped, and why

| Old mechanism | Replaced by | Why |
| --- | --- | --- |
| `pathNameCheckList`, a 32-entry list of pages that "reset" the trail | Nothing | Trails are computed from the URL and the declared parents every time, so there is no accumulated state to reset |
| `newRoute[]` at module scope and `routes` in `localStorage` | Nothing | The old trail was a navigation history that drifted from the URL on refresh and deep links. A breadcrumb is a location, not a history; the new trail is the same for a given URL no matter how you arrived |
| Replacing a numeric segment with the segment four places earlier | `pathLabels`, or a route `label` receiving `params` | The old rule only fired on one path and named the id after the wrong ancestor; now you say what the id means |
| `name.replace(/-/g, ' ')` and CSS `text-transform: capitalize` | Built-in label inference | Also handles `snake_case`, `camelCase` and percent-encoding, and applies to the structured data, which CSS cannot |
| `withRouter` and `<Link>` from React Router v5 | `path` prop and `renderLink` | The component no longer depends on any router, and works outside React |
| FontAwesome home icon | `renderLink`, `separator` or `classNames` | No icon dependency; add whichever icon set the app already has |
| `breadcrumbNavHeader.scss` | Tailwind defaults or `styles.css` | No Sass build required |
| Nothing | `BreadcrumbList` JSON-LD, `aria-current`, hidden separators | The old component had no structured data and linked the current page |
