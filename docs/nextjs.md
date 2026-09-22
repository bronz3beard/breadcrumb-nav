# Next.js

`breadcrumb-nav/next` is the React component with two things filled in for you: the current path comes from the
router, and ancestor crumbs are rendered with `next/link`. Everything else, including the
[routes and labels](./routes-and-labels.md) options, is the same as the plain React component.

## App Router

Put it in a layout so every page below gets a trail. It is a client component (it reads the pathname with a hook),
but Next.js still renders client components on the server, so the trail and its structured data are in the HTML that
search engines receive.

```tsx
// app/layout.tsx
import { Breadcrumbs } from 'breadcrumb-nav/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Breadcrumbs baseUrl="https://example.com" />
        {children}
      </body>
    </html>
  )
}
```

`baseUrl` is your site's public origin. It is required because the structured data has to carry absolute URLs (see
[SEO](./seo.md)). If you already set `metadataBase` in your root metadata, use the same value.

Pages whose URL contains an id usually need a real name in the trail. Provide it with `pathLabels` from the page that
knows the name, using the plain component from `breadcrumb-nav` (it is a Server Component-safe function, so it works
directly in a server page):

```tsx
// app/forms/[id]/page.tsx
import { Breadcrumbs } from 'breadcrumb-nav'
import { getForm } from '@/lib/forms'

export default async function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getForm(id)
  return (
    <>
      <Breadcrumbs
        path={`/forms/${id}`}
        pathLabels={{ [`/forms/${id}`]: form.name }}
        baseUrl="https://example.com"
      />
      <h1>{form.name}</h1>
    </>
  )
}
```

That version ships no client JavaScript for the trail at all. Use it when you want the trail in the page rather than
the layout, or when you want zero client code; use the layout version when one placement should cover every page.
Whichever you pick, render one trail per page: two components means two BreadcrumbList entries.

## Pages Router

There is no `usePathname()` during Pages Router prerendering, so pass the path yourself from the router:

```tsx
// pages/_app.tsx
import { useRouter } from 'next/router'
import { Breadcrumbs } from 'breadcrumb-nav/next'

export default function App({ Component, pageProps }) {
  const { asPath } = useRouter()
  return (
    <>
      <Breadcrumbs path={asPath} baseUrl="https://example.com" />
      <Component {...pageProps} />
    </>
  )
}
```

`asPath` includes the query string and hash; the component ignores them.

## Declared routes

Next.js file routes can be declared as they are, `[id]` and `[...slug]` included:

```ts
// lib/routes.ts
import { defineRoutes } from 'breadcrumb-nav'

export const routes = defineRoutes([
  { path: '/docs', label: 'Documentation' },
  { path: '/docs/[...slug]' },
  { path: '/account/settings', parent: '/account' },
  { path: '/account' },
])
```

Then `<Breadcrumbs routes={routes} labels={{ '/docs/[...slug]': 'Guide' }} baseUrl="…" />`. A `labels` key that is
not a declared route is a compile error. See [routes and labels](./routes-and-labels.md).

## Trailing slashes

If `next.config.js` sets `trailingSlash: true`, pass `trailingSlash="always"` so crumb hrefs and the URLs in the
structured data match your canonical URLs.

## Tailwind CSS 4

Tailwind only generates the classes it can see, and it does not look inside `node_modules` by default. Add one line
to your global stylesheet, with the path relative to that file:

| Your stylesheet | Add |
| --- | --- |
| `app/globals.css` | `@source "../node_modules/breadcrumb-nav/dist";` |
| `src/app/globals.css` | `@source "../../node_modules/breadcrumb-nav/dist";` |

Without Tailwind, import the plain stylesheet once instead: `import 'breadcrumb-nav/styles.css'`. Both are covered
in [styling](./styling.md).

## Checking it worked

View the page source (not the DOM inspector) and look for `<nav aria-label="Breadcrumb">` and, right after it, a
`<script type="application/ld+json">` containing `"BreadcrumbList"`. The [SEO page](./seo.md) explains what each part
does and how to run Google's Rich Results Test on it.
