# API summary

Every public name on one page. CI fails when something exported from the package is missing here, so this list is
complete for the version it ships with. Explanations live on the other pages; this is the reference.

## Entry points

| Import from | Contains | Needs |
| --- | --- | --- |
| `breadcrumb-nav` | `Breadcrumbs`, `BreadcrumbJsonLd`, and everything from the core | React 18.3 or 19 |
| `breadcrumb-nav/next` | `Breadcrumbs` for Next.js, `BreadcrumbJsonLd` | React, Next.js 14 or later |
| `breadcrumb-nav/element` | `BreadcrumbNavElement`, `defineBreadcrumbNav` | nothing |
| `breadcrumb-nav/core` | the functions and types below, no framework | nothing |
| `breadcrumb-nav/styles.css` | the plain stylesheet | nothing |

## Core functions

| Name | Signature | Notes |
| --- | --- | --- |
| `buildBreadcrumbs` | `(options: BuildOptions) => Crumb[]` | Pure. The trail for a path |
| `defineRoutes` | `(routes) => routes` | Keeps literal types so `labels` keys and `parent` values are compile-checked; validates parents at runtime |
| `toJsonLd` | `({ crumbs, baseUrl }) => BreadcrumbList` | The schema.org structured data |
| `serializeJsonLd` | `(jsonLd: BreadcrumbList) => string` | JSON with `<`, `>`, `&`, U+2028, U+2029 as `\u` escapes, safe inside `<script>` |
| `renderBreadcrumbsHtml` | `(options: RenderOptions) => string` | The trail and its JSON-LD as an HTML string, for servers outside React |
| `formatSegmentLabel` | `(segment: string) => string` | The built-in label inference |
| `resolveClassNames` | `({ classNames?, unstyled? }) => ClassNames` | Merges consumer classes onto `DEFAULT_CLASSES` |
| `DEFAULT_CLASSES` | `ClassNames` | The default Tailwind utilities per part |
| `BreadcrumbError` | `class extends Error` | Thrown for every configuration problem; has a `code` |

## `BuildOptions`

Accepted by `buildBreadcrumbs`, and as props or attributes by every renderer.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `path` | `string` | required | The pathname. Query string and hash ignored |
| `routes` | `readonly RouteDef[]` | | Declared routes, ideally from `defineRoutes` |
| `labels` | `Partial<Record<RoutePath, Label>>` | | By route pattern. Needs `routes`; unknown keys are compile and runtime errors |
| `pathLabels` | `Record<\`/${string}\`, Label>` | | By concrete path. Foreign keys ignored |
| `home` | `HomeOptions \| false` | Home at `/` | The first crumb, or none |
| `basePath` | `string` | | The prefix the app lives under |
| `strict` | `boolean` | `false` | Leave out undeclared ancestors |
| `formatLabel` | `(context: LabelContext) => string` | inference | Label for segments with no other label |
| `trailingSlash` | `TrailingSlash` (`'never' \| 'always'`) | `'never'` | Whether hrefs end in `/` |

### `RouteDef`

| Field | Type | Notes |
| --- | --- | --- |
| `path` | `string` | Pattern: static segments, `:id` or `[id]`, `[...rest]` or `*` last |
| `label` | `Label` | String or function of `LabelContext` |
| `parent` | `RoutePath` | A declared path; compile-checked by `defineRoutes` |
| `hidden` | `boolean` | Omitted from the trail when an ancestor |

### `HomeOptions`

| Field | Type | Default |
| --- | --- | --- |
| `label` | `string` | `'Home'` |
| `href` | `string` | `basePath` or `/` |

### `Label` and `LabelContext`

`Label` is `string | ((context: LabelContext) => string)`. A `LabelContext` has `segment` (decoded), `params`
(from the matched pattern) and `path` (the crumb's href).

### `RoutePath`

`RoutePath<typeof routes>`: the union of declared paths, the key type of `labels`.

## `Crumb`

What `buildBreadcrumbs` returns, one per trail entry.

| Field | Type | Notes |
| --- | --- | --- |
| `href` | `string` | Path only |
| `label` | `string` | |
| `current` | `boolean` | True for the last crumb only |
| `pattern` | `string` | The matched route path, when routes were given |
| `params` | `Record<string, string>` | Matched params |

## Structured data

`BreadcrumbList` is `{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: BreadcrumbListItem[] }`.
A `BreadcrumbListItem` has `@type` (`'ListItem'`), `position` (1-based), `name` (the label) and `item` (the absolute
URL; absent on the current page).

## Rendering options

`RenderOptions`, taken by `renderBreadcrumbsHtml`; the React props and the element attributes mirror them.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `crumbs` | `readonly Crumb[]` | required | From `buildBreadcrumbs` |
| `baseUrl` | `string` | required unless `jsonLd` is false | Public origin for the structured data |
| `jsonLd` | `boolean` | `true` | Emit the `<script>` |
| `separator` | `string` | `'/'` | Hidden from assistive technology |
| `classNames` | `Partial<ClassNames>` | | Added to the defaults |
| `unstyled` | `boolean` | `false` | Drop the defaults |
| `ariaLabel` | `string` | `'Breadcrumb'` | The landmark's name |
| `renderOnRoot` | `boolean` | `false` | Render a one-crumb trail |

### `ClassNames`

Six parts, each a string of classes: `nav`, `list`, `item`, `link`, `current`, `separator`. Each part also carries
`data-crumb="<part>"` in the markup.

## React: `Breadcrumbs` and `BreadcrumbJsonLd`

`BreadcrumbsProps` is `BuildOptions` plus the rendering props below, plus `baseUrl` and `jsonLd` with the rule that
`baseUrl` is required unless `jsonLd` is `false`.

| Prop | Type | Default |
| --- | --- | --- |
| `separator` | `ReactNode` | `'/'` |
| `renderLink` | `(props: LinkProps) => ReactNode` | a plain `<a>` |
| `classNames` | `Partial<ClassNames>` | |
| `unstyled` | `boolean` | `false` |
| `aria-label` | `string` | `'Breadcrumb'` |
| `renderOnRoot` | `boolean` | `false` |

`LinkProps`, what `renderLink` receives: `href`, `className`, `children` and `data-crumb` (always `'link'`).

`BreadcrumbJsonLdProps`, for placing the structured data on its own: `crumbs` and `baseUrl`.

`breadcrumb-nav/next` exports the same `Breadcrumbs` with `path` optional (it defaults to `usePathname()`) and
`renderLink` defaulting to `next/link`; its props type is `NextBreadcrumbsProps`.

## Custom element: `BreadcrumbNavElement`

Registered by `defineBreadcrumbNav(tagName?)`. Attributes, all optional except `base-url`:

`path`, `base-url`, `json-ld` (`"false"` to opt out), `home` (`"false"` to remove), `home-label`, `home-href`,
`base-path`, `separator`, `strict`, `unstyled`, `render-on-root`, `trailing-slash`, `nav-label`.

Properties, for objects and functions: `routes`, `labels`, `pathLabels`, `formatLabel`, `classNames`. Method:
`refresh()`.

## Error codes

`BreadcrumbErrorCode`, the `code` of every `BreadcrumbError`:

| Code | When |
| --- | --- |
| `INVALID_PATH` | A path, key or pattern is not a pathname, has a bad `%` escape, is outside `basePath`, or has a non-final catch-all |
| `LABEL_WITHOUT_ROUTE` | A `labels` key that is not a declared pattern |
| `LABELS_REQUIRE_ROUTES` | `labels` without `routes` |
| `UNKNOWN_PARENT` | A `parent` not declared, or missing a param the page cannot supply |
| `PARENT_CYCLE` | A parent chain that loops |
| `BASE_URL_REQUIRED` | Structured data on, `baseUrl` missing |
| `INVALID_BASE_URL` | `baseUrl` is not an absolute `http(s)` URL |
