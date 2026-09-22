# Changelog

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 - 22/09/2026
- no changes from previous version just doing an official release.

## 1.0.0-beta.1 - unreleased

The first release. A rewrite of an internal React breadcrumb component as a framework-agnostic package. The old
component's behaviours worth keeping (labels from the URL, a home crumb, a current page that is not a link, and
parents that are not URL parents) are all here as declarations; its navigation history in `localStorage` is not, on
purpose. See [migrating from the old component](./docs/migration-from-legacy.md).

### Added

- **`buildBreadcrumbs()`**: the trail for a path, of any depth. Labels are inferred from URL segments
  (`expense-claims` → "Expense Claims", `userSettings` → "User Settings"); `pathLabels` names specific pages.
- **`defineRoutes()`**: declared routes with `:id`, `[id]`, `[...rest]` and `*` patterns, `parent` for pages whose
  place in the site is not their URL, `hidden` for segments that should not appear, and `label` per pattern. Literal
  types are kept, so a `labels` key or a `parent` that is not a declared path is a compile error.
- **Structured data by default**: a schema.org `BreadcrumbList` in JSON-LD, generated from the same crumbs as the
  visible trail, with absolute URLs from a required `baseUrl` and script-safe serialisation.
- **`<Breadcrumbs>`** for React, server-safe (no hooks), with `renderLink` for router links and `<BreadcrumbJsonLd>`
  for placing the structured data separately. **`breadcrumb-nav/next`** wires `usePathname()` and `next/link`.
- **`<breadcrumb-nav>`**, a light-DOM custom element for Angular, Vue, Svelte, Astro and plain HTML, following
  navigation through the Navigation API where available.
- **`renderBreadcrumbsHtml()`** for server rendering outside React.
- **Accessible markup**: a `<nav>` landmark, an ordered list, real links in trail order, `aria-current="page"` on the
  current page, separators hidden from assistive technology; checked with axe in every renderer's tests.
- **Tailwind CSS 4 defaults** with no colour classes, so the trail inherits the page's text colour; `classNames` and
  `unstyled` to adjust; `breadcrumb-nav/styles.css` for projects without Tailwind.
- **Documentation** with a plain-language explanation of JSON-LD, an API summary checked against the code in CI, and a
  setup prompt for AI assistants validated against two fixture projects.
