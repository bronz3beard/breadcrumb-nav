# Plain JavaScript and other frameworks

Outside React there are two ways to use the package, and both produce exactly the same markup and structured data
as the React component:

- **`<breadcrumb-nav>`**, a custom element, for anything that renders in a browser: Angular, Vue, Svelte, Astro
  islands, HTMX, a static HTML page.
- **`renderBreadcrumbsHtml()`**, a function that returns the HTML as a string, for server rendering outside React:
  Angular SSR, Astro, Eleventy, Express templates, edge functions.

Route declarations, labels and every option are the same as in React; see [routes and labels](./routes-and-labels.md).

## The custom element

Register it once, then use it like any tag:

```js
import { defineBreadcrumbNav } from 'breadcrumb-nav/element'

defineBreadcrumbNav()
```

```html
<breadcrumb-nav base-url="https://example.com"></breadcrumb-nav>
```

Without a `path` attribute it reads the page's own `location.pathname`. The trail and its JSON-LD are rendered into
the element itself (no shadow DOM), so your page CSS and Tailwind apply to it.

### Attributes

| Attribute | Meaning | Default |
| --- | --- | --- |
| `base-url` | Your site's public origin, for the absolute URLs in the structured data. Required unless `json-ld="false"`. | |
| `path` | The pathname to describe. | `location.pathname` |
| `json-ld` | `"false"` turns the structured data off. | on |
| `home` | `"false"` removes the Home crumb. | shown |
| `home-label`, `home-href` | Text and target of the Home crumb. | `Home`, `/` or `base-path` |
| `base-path` | The prefix your app lives under, such as `/app`. | |
| `separator` | Text between crumbs. It is hidden from screen readers. | `/` |
| `strict` | Present: ancestors without a declared route are left out. | |
| `unstyled` | Present: no default classes. | |
| `render-on-root` | Present: render even a one-crumb trail. | |
| `trailing-slash` | `always` or `never`, to match your canonical URLs. | `never` |
| `nav-label` | The accessible name of the landmark. Translate it for non-English sites. | `Breadcrumb` |

### Properties

Objects and functions cannot go in attributes, so set them as properties from JavaScript:

```js
import { defineRoutes } from 'breadcrumb-nav/core'

const el = document.querySelector('breadcrumb-nav')
el.routes = defineRoutes([
  { path: '/form-settings' },
  { path: '/forms', parent: '/form-settings' },
  { path: '/forms/:id' },
])
el.labels = { '/forms/:id': ({ params }) => `Form ${params.id}` }
el.pathLabels = { '/forms/42': 'Expense claim' }
el.classNames = { link: 'text-blue-700' }
```

Setting a property or changing an attribute re-renders immediately.

### Keeping up with navigation

In browsers with the Navigation API the element re-renders after every navigation, including `pushState`. Elsewhere
it only hears `popstate` (the back and forward buttons), because `pushState` fires no event. So if your router
navigates with `pushState`, tell the element after each navigation, either by setting `path` or by calling
`refresh()`:

```js
router.afterEach(() => el.refresh())
```

### Angular

Allow custom elements in the module or component (`schemas: [CUSTOM_ELEMENTS_SCHEMA]`), then bind `path` to the
router so the element follows in-app navigation:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { filter, map, startWith } from 'rxjs'
import { defineBreadcrumbNav } from 'breadcrumb-nav/element'

defineBreadcrumbNav()

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<breadcrumb-nav [attr.path]="path()" base-url="https://example.com"></breadcrumb-nav>`,
})
export class BreadcrumbsComponent {
  private router = inject(Router)
  path = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
  )
}
```

For Angular SSR, or any server-rendered page, the element does not run on the server (custom elements need a
browser). Use `renderBreadcrumbsHtml()` below for the initial HTML, or accept that the trail appears after
hydration; search engines that execute JavaScript will still see it, but the HTML-string route is the safe one.

### Vue and Svelte

Vue: tell the compiler the tag is a custom element (`compilerOptions.isCustomElement = tag => tag === 'breadcrumb-nav'`)
and bind `:path="route.path"`. Svelte and SvelteKit: use the tag directly and bind `path={$page.url.pathname}`.
Both re-render the element whenever the bound value changes, so no `refresh()` call is needed.

## HTML from a string

For server rendering, build the crumbs and render them to a string. Escaping is handled; the output is safe to write
straight into a template:

```js
import { buildBreadcrumbs, renderBreadcrumbsHtml } from 'breadcrumb-nav/core'

const crumbs = buildBreadcrumbs({ path: request.path, pathLabels })
const html = renderBreadcrumbsHtml({ crumbs, baseUrl: 'https://example.com' })
// <nav aria-label="Breadcrumb" …>…</nav><script type="application/ld+json">…</script>
```

`renderBreadcrumbsHtml` takes the same rendering options as the element: `jsonLd`, `separator`, `classNames`,
`unstyled`, `ariaLabel` and `renderOnRoot`. It returns an empty string for a one-crumb trail unless `renderOnRoot` is
set.

## Styling

The default classes are Tailwind CSS 4 utilities. Add `@source "../node_modules/breadcrumb-nav/dist";` to your
stylesheet (path relative to that file) so Tailwind generates them, or import `breadcrumb-nav/styles.css` if you
don't use Tailwind. Details, including the `data-crumb` hooks for your own CSS, are in [styling](./styling.md).
