# Getting started

Five steps, about ten minutes. By the end every page has a breadcrumb trail that search engines can read.

## 1. Install

```sh
npm install breadcrumb-nav
```

Then pick the entry for your project:

| You use | Import from | Notes |
| --- | --- | --- |
| React | `breadcrumb-nav` | You pass the current path from your router |
| Next.js | `breadcrumb-nav/next` | The path and `next/link` are wired for you |
| Angular, Vue, Svelte, plain HTML | `breadcrumb-nav/element` | A custom element that reads the page URL |
| A server template with no framework | `breadcrumb-nav/core` | `renderBreadcrumbsHtml()` returns HTML |

## 2. Render your first trail

The one value you must provide is `baseUrl`: your site's public origin, such as `https://example.com`. The structured
data needs absolute URLs, and only you know the domain. During local development use the real production origin
anyway; it only appears inside the structured data, never in the links.

React:

```tsx
import { Breadcrumbs } from 'breadcrumb-nav'

<Breadcrumbs path={pathname} baseUrl="https://example.com" />
```

Next.js (in a layout):

```tsx
import { Breadcrumbs } from 'breadcrumb-nav/next'

<Breadcrumbs baseUrl="https://example.com" />
```

Anywhere else:

```js
import { defineBreadcrumbNav } from 'breadcrumb-nav/element'
defineBreadcrumbNav()
```

```html
<breadcrumb-nav base-url="https://example.com"></breadcrumb-nav>
```

Open a page two or more levels deep. You should see **Home / Section / Page**, with the labels made from the URL:
`/reports/annual-summary` gives "Reports" and "Annual Summary". On the site root nothing renders, on purpose: a trail
of one item tells nobody anything.

## 3. Give ids real names

A page like `/forms/42` shows "42" until you say what it is. Pass the name from wherever you already have it:

```tsx
<Breadcrumbs
  path={pathname}
  pathLabels={{ [`/forms/${form.id}`]: form.name }}
  baseUrl="https://example.com"
/>
```

`pathLabels` is keyed by the concrete path. One map can hold names for many pages; keys for other pages are simply
ignored, so it is fine to build it once for the whole app.

## 4. Declare routes when the URL is not the hierarchy

Sometimes a page's parent is not its URL parent: `/forms` belongs under "Form settings", or `/orgs/acme/billing`
should read Home / Acme / Billing without an "Orgs" crumb. Declare routes with `defineRoutes` and name the parent:

```ts
import { defineRoutes } from 'breadcrumb-nav'

export const routes = defineRoutes([
  { path: '/form-settings' },
  { path: '/forms', parent: '/form-settings' },
  { path: '/forms/:id', label: ({ params }) => `Form ${params.id}` },
])
```

Pass `routes={routes}` and the trail for `/forms/42/edit` becomes Home / Form Settings / Forms / Form 42 / Edit.
Chains can be any depth. A `parent` that is not a declared path is a compile error. Everything else you can declare
is on the [routes and labels](./routes-and-labels.md) page.

## 5. Check it worked

1. Open a deep page and **view the page source** (not the element inspector). Search for `aria-label="Breadcrumb"`.
   You should find the `<nav>` and, right after it, `<script type="application/ld+json">` containing
   `"BreadcrumbList"`. If the nav is there but the script is not, `jsonLd` has been turned off.
2. Paste the page URL into [Google's Rich Results Test](https://search.google.com/test/rich-results). It should
   report one **Breadcrumbs** item with no errors. The [SEO page](./seo.md) explains each field it shows.
3. Press Tab through the trail. Focus should move along the links in order with a visible ring, and skip the current
   page, which is not a link.

## Next

- Style it with Tailwind or the plain stylesheet: [styling](./styling.md).
- Understand what the structured data is doing for you: [SEO](./seo.md).
- Replacing the old internal breadcrumb component: [migration](./migration-from-legacy.md).
