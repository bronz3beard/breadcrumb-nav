# Routes and labels

How a path becomes a trail, and every way to shape it. All of this applies to React, Next.js, the custom element
(as attributes and properties) and `buildBreadcrumbs()` itself.

## Without any configuration

The trail is Home, then one crumb per URL segment, the last one being the current page. Labels come from the
segments:

| Segment | Label |
| --- | --- |
| `expense-claims` | Expense Claims |
| `annual_report` | Annual Report |
| `userSettings` | User Settings |
| `caf%C3%A9` | Café |
| `42`, `3f2504e0-…` | unchanged |
| `v1.2`, `index.html` | V1.2, Index.html (dots are kept: in URLs they are versions and file names) |

Query strings and hashes are ignored. Repeated slashes are collapsed. Links keep the URL's original spelling, so an
encoded segment stays encoded in the `href` and decoded in the label.

`formatLabel` replaces this inference for segments that have no other label. It receives the decoded segment, the
matched params if any, and the crumb's own path:

```ts
formatLabel: ({ segment }) => segment.toUpperCase()
```

## Naming specific pages: `pathLabels`

Keyed by concrete path, matched against each crumb's link after normalisation (so trailing slashes don't matter):

```ts
pathLabels: {
  '/': 'Start',
  '/forms/42': 'Expense claim',
  '/orgs/acme': ({ segment }) => `Org ${segment}`,
}
```

Keys for pages that are not in the current trail are ignored, so one app-wide map is fine. A key that is not a path
(no leading slash) throws `INVALID_PATH`. In TypeScript, keys must start with `/`.

## Declaring routes

Use routes when the hierarchy is not the URL, when you want a label for every page matching a pattern, or when you
want the compiler to check your labels.

```ts
import { defineRoutes } from 'breadcrumb-nav'

export const routes = defineRoutes([
  { path: '/docs', label: 'Documentation' },
  { path: '/docs/[...slug]' },
  { path: '/form-settings' },
  { path: '/forms', parent: '/form-settings' },
  { path: '/forms/:id', label: ({ params }) => `Form ${params.id}` },
  { path: '/internal/question', hidden: true },
])
```

### Patterns

| Segment | Matches | Param |
| --- | --- | --- |
| `docs` | exactly `docs` | |
| `:id` or `[id]` | one segment | `params.id` |
| `[...rest]` or `*` | one or more remaining segments, last only | `params.rest` (or `params['*']`), joined with `/` |

Patterns are absolute paths, including your `basePath` if you use one. When several patterns match, the most
specific wins: a static segment beats a param, which beats a catch-all, position by position; on a tie the first
declared wins.

### `label`

A string, or a function of `{ segment, params, path }`. Applies to every page matching the pattern.

### `parent`

The pattern of the page's logical parent. The trail then continues from the parent's own trail instead of the URL
ancestors, and this repeats up the chain, so a hierarchy of any depth is honoured:

```
/form-settings                    Home / Form Settings
/forms  (parent /form-settings)   Home / Form Settings / Forms
/forms/42                         Home / Form Settings / Forms / Form 42
/forms/42/edit                    Home / Form Settings / Forms / Form 42 / Edit
```

Pages beneath a page that declares a parent inherit its chain, as `/forms/42/edit` does above. A parent pattern with
params is filled from the current page's params, so `/orgs/:orgId/billing` can name `/orgs/:orgId` as its parent.

`defineRoutes` checks parents twice: a `parent` that is not a declared `path` is a compile error, and at runtime it
throws `UNKNOWN_PARENT`. A chain that loops throws `PARENT_CYCLE`.

### `hidden`

Leaves the page out of the trail when it is an ancestor. The URL segment `question` in `/internal/question/7`
disappears from the trail if `/internal/question` is hidden. A hidden page is still shown when it is the current
page.

### `strict`

By default an ancestor with no declared route still appears, with an inferred label. With `strict: true` only
declared routes appear as ancestors. The current page always appears.

## Labels for declared routes: `labels`

Keyed by route pattern, so one entry covers every page matching it:

```ts
labels: {
  '/docs/[...slug]': 'Guide',
  '/forms/:id': ({ params }) => `Form ${params.id}`,
}
```

With `defineRoutes`, a key that is not a declared pattern is a compile error. At runtime it throws
`LABEL_WITHOUT_ROUTE`, and `labels` without `routes` throws `LABELS_REQUIRE_ROUTES`. For a concrete path, use
`pathLabels`.

## Precedence

For each crumb, the first of these that exists wins:

1. `pathLabels` for the crumb's path
2. `labels` for the matched pattern
3. The route's own `label`
4. `formatLabel`
5. The built-in inference

## Home, `basePath` and trailing slashes

- `home: { label: 'Dashboard', href: '/app' }` changes the first crumb; `home: false` removes it. A `pathLabels` entry
  for `/`, or a declared route for `/`, also relabels it.
- `basePath: '/app'` for an app that lives under a prefix. Home points at the base and crumbs start below it; a path
  outside the base throws `INVALID_PATH`. Route patterns include the base.
- `trailingSlash: 'always'` puts `/` at the end of every link below the root. Match your canonical URLs so the
  structured data agrees with them.

## Errors

Every error is a `BreadcrumbError` with a stable `code`:

| Code | When |
| --- | --- |
| `INVALID_PATH` | A path, key or pattern that does not start with `/`, is a full URL, has a malformed `%` escape, is outside `basePath`, or has a catch-all that is not last |
| `LABEL_WITHOUT_ROUTE` | A `labels` key that is not a declared route pattern |
| `LABELS_REQUIRE_ROUTES` | `labels` given without `routes` |
| `UNKNOWN_PARENT` | A `parent` that is not a declared route, or one whose params the page cannot supply |
| `PARENT_CYCLE` | A parent chain that loops |
| `BASE_URL_REQUIRED` | Structured data on, `baseUrl` missing |
| `INVALID_BASE_URL` | `baseUrl` is not an absolute `http(s)` URL |

They are thrown, never logged and swallowed: a breadcrumb that silently shows the wrong trail is worse than one
that fails loudly in development.
