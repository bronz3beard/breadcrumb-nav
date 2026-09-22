# React

`breadcrumb-nav` exports `<Breadcrumbs>`, `<BreadcrumbJsonLd>` and every core function. The component has no hooks
and touches no browser API, so it renders anywhere React does: in the browser, with `renderToString`, and in React
Server Components. The Next.js wrapper is on its [own page](./nextjs.md).

## Props

Everything from [routes and labels](./routes-and-labels.md) is a prop (`path`, `routes`, `labels`, `pathLabels`,
`home`, `basePath`, `strict`, `formatLabel`, `trailingSlash`), plus:

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `baseUrl` | `string` | required | Your public origin, for the absolute URLs in the structured data |
| `jsonLd` | `boolean` | `true` | Emit the `BreadcrumbList` script after the `<nav>`. `false` makes `baseUrl` optional |
| `separator` | `ReactNode` | `'/'` | Between crumbs; rendered with `aria-hidden` |
| `renderLink` | `(props) => ReactNode` | plain `<a>` | Renders each ancestor link; see below |
| `classNames` | `Partial<ClassNames>` | | Classes added to the defaults per part; see [styling](./styling.md) |
| `unstyled` | `boolean` | `false` | Drop the default classes |
| `aria-label` | `string` | `'Breadcrumb'` | The landmark's accessible name; translate it for non-English sites |
| `renderOnRoot` | `boolean` | `false` | Render even a one-crumb trail |

The types make `baseUrl` required unless you write `jsonLd={false}`; in JavaScript the same rule throws
`BASE_URL_REQUIRED` at first render.

## The current path

The component does not know your router. Pass the path from it:

```tsx
// React Router
import { useLocation } from 'react-router'
const { pathname } = useLocation()
<Breadcrumbs path={pathname} baseUrl="https://example.com" />
```

```tsx
// TanStack Router
import { useLocation } from '@tanstack/react-router'
const pathname = useLocation({ select: location => location.pathname })
```

Query strings and hashes are ignored, so passing a full `location.pathname + location.search` is harmless.

## Links through your router

By default ancestors are plain `<a href>` elements, which is what crawlers want and what every router handles
(a full page load). For client-side navigation, render the link with your router's component. You receive `href`,
`className`, `children` and `data-crumb`; spread the rest so classes and the styling hook stay:

```tsx
import { Link } from 'react-router'

<Breadcrumbs
  path={pathname}
  baseUrl="https://example.com"
  renderLink={({ href, ...rest }) => <Link to={href} {...rest} />}
/>
```

## Placing the structured data elsewhere

If the visible trail lives in the page but you want the structured data in a layout, or the other way round, turn
`jsonLd` off on the component and place `<BreadcrumbJsonLd>` yourself with the same crumbs:

```tsx
import { Breadcrumbs, BreadcrumbJsonLd, buildBreadcrumbs } from 'breadcrumb-nav'

const crumbs = buildBreadcrumbs({ path: pathname, pathLabels })

<BreadcrumbJsonLd crumbs={crumbs} baseUrl="https://example.com" />
<Breadcrumbs path={pathname} pathLabels={pathLabels} jsonLd={false} />
```

Render one `BreadcrumbList` per page. Two means two trails in the eyes of a crawler.

## Errors

The component throws a `BreadcrumbError` with a `code` for anything that would otherwise fail silently: a missing
`baseUrl`, a `labels` key that matches no route, a `parent` chain that loops. The codes are listed on the
[routes and labels](./routes-and-labels.md#errors) page. They throw during render, so an error boundary around the
trail is a reasonable safety net in production, but the right fix is always the configuration.
