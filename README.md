# breadcrumb-nav

[![npm](https://img.shields.io/npm/v/breadcrumb-nav)](https://www.npmjs.com/package/breadcrumb-nav)
[![license](https://img.shields.io/npm/l/breadcrumb-nav)](./LICENSE)

Breadcrumb navigation that search engines understand. Give it the current path and it renders an accessible trail
and the structured data Google reads, with readable labels worked out from the URL. Works in React, Next.js and, as a
custom element, in Angular, Vue, Svelte or plain HTML.

- **SEO-correct by default.** A `<nav>` landmark, real links, `aria-current` on the current page, and a schema.org
  `BreadcrumbList` in JSON-LD, generated from the same list so they can never disagree. [What that means](#seo).
- **Any depth, any hierarchy.** Trails follow the URL, or a type-checked list of routes when a page's parent is not
  its URL parent.
- **Labels for free.** `/expense-claims` becomes "Expense Claims". Give ids real names with one object.
- **Accessible.** Keyboard order follows the trail; separators are hidden from screen readers; tested with axe.
- **Tiny.** Zero runtime dependencies. About 4 kB gzipped for the React component, less for the core alone.
- **Tailwind CSS 4** defaults that follow your page's text colour, or a plain stylesheet under a kilobyte.
- TypeScript and JavaScript, ES modules only.

**[Try it in the playground](https://bronz3beard.github.io/breadcrumb-nav/)**: click through a fake site and watch
the trail, its structured data and the HTML string change together, in React, as a custom element, with Tailwind or
the plain stylesheet.

## Contents

- [Install](#install)
- [Set this up with an AI assistant](#set-this-up-with-an-ai-assistant)
- [Quick start](#quick-start)
  - [React](#react)
  - [Next.js](#nextjs)
  - [Angular, Vue, Svelte or plain HTML](#angular-vue-svelte-or-plain-html)
  - [Server-rendered HTML](#server-rendered-html)
- [What it renders](#what-it-renders)
- [Routes and labels](#routes-and-labels)
- [SEO](#seo)
- [Styling](#styling)
- [Documentation](#documentation)
- [Coming from the old component?](#coming-from-the-old-component)
- [License](#license)

## Install

```sh
npm install breadcrumb-nav
```

React 18.3 or 19 is a peer dependency for the React and Next.js entries; the core and the custom element need
nothing. The package is published as ES modules, so it works in every current bundler and in Node.js 22.12 or
later; it can't be loaded with `require()`.

## Set this up with an AI assistant

There's a prompt you can paste into any AI coding assistant. It reads your project, asks for your site's public origin
and which pages need real names, then adds the trail in the right place for your framework, fixes the stylesheet
line, removes any old breadcrumbs, and gives you the steps to check it.

**[Get the prompt](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/agent-setup.md)**, paste it into
your assistant, and answer its questions. That page also lists the five things to check before you trust what it
wrote, and an `AGENTS.md` block to keep in your repo so later sessions don't re-guess the choices this one made.

The prompt is tested: assistants of three sizes set up a Next.js app and a Vite app from scratch, and what they got
wrong is what its rules are there to prevent. The results are on that page.

Doing it by hand is quick too: the [quick start](#quick-start) below, or
[getting started](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/getting-started.md) for the
five-step version.

## Quick start

Every entry needs one thing from you: `baseUrl`, your site's public origin. The structured data must carry absolute
URLs, so there is no useful default. (If you don't want structured data, say so with `jsonLd={false}`.)

### React

Pass the current path from whatever router you use, for example `useLocation().pathname` from React Router:

```tsx
import { Breadcrumbs } from 'breadcrumb-nav'

export function App({ pathname }: { pathname: string }) {
  return (
    <Breadcrumbs
      path={pathname}
      baseUrl="https://example.com"
      pathLabels={{ '/forms/42': 'Expense claim' }}
    />
  )
}
```

On `/forms/42` that renders **Home / Forms / Expense claim**. The component has no hooks, so it also works in React
Server Components and with `renderToString`. To render links with your router's `Link`, pass `renderLink`; see
[React](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/react.md).

### Next.js

The Next.js entry reads the path from the router and links with `next/link`. Put it in a layout:

```tsx
// app/layout.tsx
import { Breadcrumbs } from 'breadcrumb-nav/next'

export default function RootLayout({ children }) {
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

It is a client component, and Next.js still renders it on the server, so crawlers get the trail in the HTML. The
[Next.js page](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/nextjs.md) covers the Pages Router, a
zero-client-JavaScript variant, and naming pages that have ids.

### Angular, Vue, Svelte or plain HTML

The custom element renders the same markup into the page. Register it once:

```js
import { defineBreadcrumbNav } from 'breadcrumb-nav/element'

defineBreadcrumbNav()
```

```html
<breadcrumb-nav base-url="https://example.com"></breadcrumb-nav>
```

It reads the page's own URL, or a `path` attribute if you set one. Routes and labels are set as properties. The
[plain JavaScript page](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/vanilla.md) has the attribute
list and recipes for Angular, Vue and Svelte routers.

### Server-rendered HTML

For templates outside React (Angular SSR, Astro, Eleventy, Express), get the HTML as a string:

```js
import { buildBreadcrumbs, renderBreadcrumbsHtml } from 'breadcrumb-nav/core'

const crumbs = buildBreadcrumbs({ path: '/forms/42' })
const html = renderBreadcrumbsHtml({ crumbs, baseUrl: 'https://example.com' })
```

## What it renders

Every entry produces the same thing:

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a><span aria-hidden="true">/</span></li>
    <li><a href="/forms">Forms</a><span aria-hidden="true">/</span></li>
    <li><span aria-current="page">Expense claim</span></li>
  </ol>
</nav>
<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"https://example.com/"},
    {"@type":"ListItem","position":2,"name":"Forms","item":"https://example.com/forms"},
    {"@type":"ListItem","position":3,"name":"Expense claim"}]}
</script>
```

Classes are omitted above for clarity. On the site root, where the trail would be a single "Home", nothing is
rendered at all.

## Routes and labels

Without any configuration the trail follows the URL and labels come from the segments: `annual_report` is
"Annual Report", `userSettings` is "User Settings". Ids stay as they are until you name them:

```ts
pathLabels: { '/forms/42': 'Expense claim' }
```

When a page's place in your site is not its place in the URL, declare routes. A route can name its `parent`, chains
can go as deep as you like, and pages underneath inherit the chain:

```ts
import { defineRoutes } from 'breadcrumb-nav'

export const routes = defineRoutes([
  { path: '/form-settings' },
  { path: '/forms', parent: '/form-settings' },
  { path: '/forms/:id', label: ({ params }) => `Form ${params.id}` },
])
```

Now `/forms/42/edit` reads **Home / Form Settings / Forms / Form 42 / Edit**. Patterns accept `:id`, `[id]` and
`[...rest]`, so Next.js file routes can be copied as they are. Labels keyed by route pattern (`labels`) are checked
against the declared routes: a typo is a compile error in TypeScript and a thrown error in JavaScript. The full story,
including `hidden`, `strict`, `basePath` and trailing slashes, is in
[routes and labels](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/routes-and-labels.md).

## SEO

Search engines use breadcrumbs to understand where a page sits in your site, and can show the trail in results in
place of the raw URL. To do that reliably they read structured data: a small block of JSON in the page, in a format
called JSON-LD, listing each crumb's name and address. This package writes that block for you, next to the visible
trail, from the same data, so the two always match. All you provide is `baseUrl`.

The [SEO page](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/seo.md) explains JSON-LD from scratch,
lists exactly what is emitted and why, and shows how to check a page with Google's Rich Results Test.

## Styling

The defaults are Tailwind CSS 4 utilities with no colours, so the trail inherits your text colour in light and dark
mode. Tailwind needs to be told to scan the package; add one line to your stylesheet, with the path relative to it:

```css
@import 'tailwindcss';
@source '../node_modules/breadcrumb-nav/dist';
```

Not using Tailwind? Import `breadcrumb-nav/styles.css` instead. Adjust with `classNames`, or start from nothing with
`unstyled`. See [styling](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/styling.md).

## Documentation

- [Getting started](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/getting-started.md): install, first
  trail, naming ids, declaring routes, checking it worked
- [React](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/react.md): every prop, router links,
  placing the structured data separately
- [Next.js](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/nextjs.md): App Router, Pages Router,
  server pages with ids
- [Plain JavaScript and other frameworks](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/vanilla.md):
  the custom element, Angular, Vue, Svelte, HTML strings
- [Routes and labels](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/routes-and-labels.md): inference,
  patterns, parents, typed labels, errors
- [SEO](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/seo.md): what JSON-LD is, what is emitted, how
  to verify it
- [Styling](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/styling.md): Tailwind, the plain stylesheet,
  class slots
- [API summary](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/api-summary.md): every export, option,
  prop, attribute and error code on one page, checked against the code in CI
- [Set this up with an AI assistant](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/agent-setup.md):
  the interview prompt, what to check afterwards, and an `AGENTS.md` block

The docs index is at [docs/README.md](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/README.md).
Maintainers: [releasing](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/releasing.md) and the
[changelog](https://github.com/bronz3beard/breadcrumb-nav/blob/main/CHANGELOG.md).

## Coming from the old component?

This package replaces an internal React breadcrumb that kept a navigation history in `localStorage` and mapped
parents in a long `if`/`else` chain. Every one of those branches becomes a one-line route declaration; the
[migration page](https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/migration-from-legacy.md) has the
full table.

## License

[MIT](./LICENSE)
