# Styling

The trail comes with one sensible default look and three ways to change it. Every renderer (React, Next.js, the
custom element and the HTML string) produces the same markup, so everything on this page applies to all of them.

## The default look, with Tailwind CSS 4

The default classes are Tailwind utilities: a small flex-wrapped list, ancestors slightly faded and underlined on
hover, the current page in medium weight, a visible focus ring for keyboard users. There are no colour classes, so
the trail takes the text colour of wherever you put it, in light and dark mode alike.

Tailwind only generates classes it can see in your source files, and it does not look inside `node_modules`. Add one
`@source` line to your global stylesheet so it scans this package. The path is relative to the stylesheet:

| Your stylesheet | Add after `@import "tailwindcss";` |
| --- | --- |
| `app/globals.css` (Next.js) | `@source "../node_modules/breadcrumb-nav/dist";` |
| `src/app/globals.css` (Next.js with `src/`) | `@source "../../node_modules/breadcrumb-nav/dist";` |
| `src/index.css` (Vite) | `@source "../node_modules/breadcrumb-nav/dist";` |
| `src/styles.css` (Angular) | `@source "../node_modules/breadcrumb-nav/dist";` |

If the trail renders unstyled, this line is the first thing to check: the classes are in the HTML, but Tailwind never
generated them.

## Without Tailwind

Import the stylesheet once, anywhere that CSS imports work:

```js
import 'breadcrumb-nav/styles.css'
```

It is under a kilobyte, gives the same look as the Tailwind defaults, and styles the `data-crumb` attributes rather
than class names, so it works whether or not the default classes are present. Use it with `unstyled` to keep the
unused Tailwind class names out of your HTML; they are harmless, just noise.

## Adjusting the defaults

Pass `classNames` with any of the six parts. What you pass is added after the defaults:

```tsx
<Breadcrumbs
  classNames={{ nav: 'mb-4', link: 'text-blue-700', current: 'text-gray-900' }}
  baseUrl="https://example.com"
/>
```

| Part | Element |
| --- | --- |
| `nav` | The `<nav>` landmark |
| `list` | The `<ol>` |
| `item` | Each `<li>` |
| `link` | Each ancestor `<a>` |
| `current` | The `<span>` for the current page |
| `separator` | The `<span>` between crumbs |

The custom element takes the same object as its `classNames` property; `renderBreadcrumbsHtml()` takes it as an
option.

## Replacing the defaults

`unstyled` drops every default class and keeps only yours:

```tsx
<Breadcrumbs unstyled classNames={{ list: 'breadcrumbs' }} baseUrl="https://example.com" />
```

On the custom element it is the `unstyled` attribute. The `data-crumb` attributes are always present, so plain CSS
can target the parts without any classes at all:

```css
[data-crumb='link']:hover {
  text-decoration: underline;
}
[data-crumb='current'] {
  font-weight: 600;
}
```

## The separator

`separator` is any text (or, in React, any node such as an icon). It is rendered with `aria-hidden`, so screen readers
never read it; the list structure already tells them where one crumb ends and the next begins.

```tsx
<Breadcrumbs separator="›" baseUrl="https://example.com" />
<Breadcrumbs separator={<ChevronIcon />} baseUrl="https://example.com" />
```

## Accessibility of the defaults

The defaults keep what the markup provides: links are real anchors in trail order, so Tab moves through them in
order; `:focus-visible` shows a two-pixel ring in the current text colour; the current page is text, not a link, and
carries `aria-current="page"`. If you replace the classes, keep a visible focus style on `link`.
