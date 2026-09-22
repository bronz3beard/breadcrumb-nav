# Set this up with an AI assistant

A prompt you can paste into any AI coding assistant. It reads your project, asks a few questions, then adds the
breadcrumb trail and its structured data in the right place for your framework, and tells you how to check it.

**Use it when** you have a working app and would rather answer questions than read guides. **Read
[getting started](./getting-started.md) instead** if you prefer doing it yourself; it is five short steps.

**What it can't do:** know your public domain (it will ask), see search results, or run Google's Rich Results Test.
It writes code and tells you what to check; you do the checking.

## The prompt

Paste everything in the block into your assistant, in the repository you want to set up.

```text
You are setting up breadcrumb-nav in this repository. Work through the steps below in order.

RULES
- Look before you ask. Read the repository first and tell me what you found; don't ask me things the code answers.
- Ask one question at a time, and wait for my answer. Offer a sensible default with each question.
- Use only the names in the ALLOWED SETTINGS list at the end of this prompt. If something I ask for isn't in that
  list, say so plainly and ask how I want to proceed. Do not invent props, attributes or options, and do not copy
  them from other breadcrumb libraries.
- Verify every name you use against the installed package's type definitions in
  node_modules/breadcrumb-nav/dist/*.d.ts. Those files are the source of truth. If the package isn't installed yet,
  install it first; if you can't, say so before writing code that depends on it.
- If you can't tell which framework, router or rendering mode (server-rendered or client-only) this project uses,
  say so and ask. Never guess and write code anyway.
- Show me each file you intend to create or change, and wait for my confirmation before writing. Never overwrite a
  file without showing me the change first.
- baseUrl is the site's real public origin with its scheme, such as https://example.com. Never localhost, never a
  path, never a placeholder you made up. If the repository doesn't state it (metadataBase, a SITE_URL variable, a
  canonical tag), ask me.
- One trail per page. Find any existing breadcrumb component or BreadcrumbList JSON-LD (search for "BreadcrumbList"
  and "aria-label=\"Breadcrumb\"") and replace it; never leave two. Never place both <Breadcrumbs> with JSON-LD on and
  <BreadcrumbJsonLd> for the same page.
- Start with inference. Do not declare routes unless a page's parent is not its URL parent, or a whole pattern needs
  a label. When ids need real names, pass them with pathLabels from the code that already has the name; never fetch
  data for the trail.
- Styling: if the project uses Tailwind CSS 4, add an @source line to the global stylesheet with the path computed
  from THAT FILE's real location to node_modules/breadcrumb-nav/dist (for example ../../node_modules/… from
  src/app/globals.css). If it uses Tailwind 3 or no Tailwind, import 'breadcrumb-nav/styles.css' once and pass
  unstyled. Never leave the trail with classes that nothing generates.
- Server rendering: React and Next.js are covered by the components. For Angular SSR, Astro SSR or any other
  server-rendered page outside React, use renderBreadcrumbsHtml() for the initial HTML; use the <breadcrumb-nav>
  element only for client-only apps or after hydration.
- Keep it plain. No wrapper components, no context providers, no configuration systems around the package.

STEP 1 — INSPECT THE REPOSITORY
Report what you find, in a short list:
- Framework and version, router, and rendering mode (for example Next.js App Router, Next.js Pages Router, Vite +
  React Router, React Router framework mode, Angular with or without SSR, Vue, SvelteKit, Astro, static HTML).
- TypeScript or JavaScript, and the package manager.
- Tailwind CSS version, and the path of the global stylesheet that imports it. Or "no Tailwind".
- Any existing breadcrumbs: a component, a "BreadcrumbList" in JSON-LD, a nav labelled Breadcrumb. Name the files.
- The public site URL if the repository states it (metadataBase, a SITE_URL or PUBLIC_URL variable, a canonical
  tag, a sitemap config), and the trailing-slash policy (for example next.config trailingSlash, or how links are
  written).
- A base path, if the app is served under a prefix.
- The route structure: how deep pages go, and which segments are ids (for example [id], :slug).
Then ask me to confirm or correct that list before going further.

STEP 2 — ASK ME
One question at a time:
- What is the public origin for baseUrl? (Skip if the repository stated it; confirm it instead.)
- Which pages with ids should show a real name in the trail, and where in the code is that name available?
- Are there pages whose place in the site is not their place in the URL? (For example /forms belongs under
  Settings.) If so, which, and what is the parent?
- Are there URL segments that should never appear as crumbs?
- Should the first crumb say "Home", or something else?
- Styling: keep the defaults, adjust with classNames, or start unstyled?
- Is the site in English? If not, what should the landmark be called (the aria-label)?

STEP 3 — PRODUCE
1. The code. Show every file, then write them after I confirm:
   - the trail placed once, where it covers every page (a layout for Next.js, the app shell for React, the root
     component for others);
   - baseUrl set to the origin from steps 1 and 2;
   - pathLabels wired for the id pages from step 2, in the code that has the names;
   - a routes file with defineRoutes only if step 2 found hierarchy differences or pattern labels, with parent
     declared where the URL is not the parent;
   - the stylesheet change from the RULES;
   - removal of any existing breadcrumbs found in step 1.
2. A verification walkthrough, as a numbered list: view the page source of a page two levels deep and find
   aria-label="Breadcrumb" and the application/ld+json script containing "BreadcrumbList"; paste the page into
   Google's Rich Results Test and expect one Breadcrumbs item with no errors; press Tab through the trail and expect
   focus to move along the links in order and skip the current page.
3. A short list of what you did NOT do, and what I still have to do myself.

STEP 4 — CHECK YOUR OWN WORK
Before you finish:
- Run the project's type check and build, and report the result. If either fails because of your changes, fix them.
- List every prop, attribute, option and function you used, and confirm each appears in ALLOWED SETTINGS below.
- Confirm out loud: baseUrl is a real https origin; exactly one BreadcrumbList per page; the @source path is
  relative to the stylesheet that contains it, or styles.css is imported; no old breadcrumb code remains.
- Confirm you produced all three things from STEP 3.

ALLOWED SETTINGS
Entry points: `breadcrumb-nav` (React, server-safe), `breadcrumb-nav/next` (Next.js), `breadcrumb-nav/element`
(custom element), `breadcrumb-nav/core` (functions only), `breadcrumb-nav/styles.css` (plain stylesheet).
Trail options, on every renderer: `path`, `routes`, `labels`, `pathLabels`, `home`, `basePath`, `strict`,
`formatLabel`, `trailingSlash`. A route has `path`, `label`, `parent`, `hidden`. `home` takes `label` and `href`.
Rendering options (renderBreadcrumbsHtml): `crumbs`, `baseUrl`, `jsonLd`, `separator`, `classNames`, `unstyled`,
`ariaLabel`, `renderOnRoot`. `classNames` parts: `nav`, `list`, `item`, `link`, `current`, `separator`.
React props (`Breadcrumbs`, `BreadcrumbsProps`; Next.js: `NextBreadcrumbsProps`): the trail options, `baseUrl`,
`jsonLd`, `separator`, `renderLink`, `classNames`, `unstyled`, `aria-label`, `renderOnRoot`. `renderLink` receives
`LinkProps`: `href`, `className`, `children`, `data-crumb`. `BreadcrumbJsonLd` takes `BreadcrumbJsonLdProps`:
`crumbs`, `baseUrl`.
Element (`BreadcrumbNavElement`, registered with `defineBreadcrumbNav`): attributes `path`, `base-url`, `json-ld`,
`home`, `home-label`, `home-href`, `base-path`, `separator`, `strict`, `unstyled`, `render-on-root`,
`trailing-slash`, `nav-label`; properties `routes`, `labels`, `pathLabels`, `formatLabel`, `classNames`; method
refresh().
Core exports: `buildBreadcrumbs`, `defineRoutes`, `toJsonLd`, `serializeJsonLd`, `renderBreadcrumbsHtml`,
`formatSegmentLabel`, `resolveClassNames`, `DEFAULT_CLASSES`, `BreadcrumbError`; types `BuildOptions`, `Crumb`,
`HomeOptions`, `Label`, `LabelContext`, `RouteDef`, `RoutePath`, `TrailingSlash`, `ClassNames`, `RenderOptions`,
`BreadcrumbList`, `BreadcrumbListItem`, `BreadcrumbErrorCode`.
Error codes: `INVALID_PATH`, `LABEL_WITHOUT_ROUTE`, `LABELS_REQUIRE_ROUTES`, `UNKNOWN_PARENT`, `PARENT_CYCLE`,
`BASE_URL_REQUIRED`, `INVALID_BASE_URL`.
Anything not in this list does not exist. If you think something is missing, ask me to check the API summary at
https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/api-summary.md rather than guessing.
```

## Checking the assistant's work

Before you trust it, read the diff for these five things. They are the mistakes assistants actually make:

1. **`baseUrl`**: a real `https://` origin, the one your site is served from. Not `localhost`, not a staging domain,
   not `https://example.com` left in from a snippet.
2. **One trail per page.** Search the project for `BreadcrumbList` and `aria-label="Breadcrumb"`. Each page should
   produce one of each. An old breadcrumb component left in place, or `<BreadcrumbJsonLd>` added beside a
   `<Breadcrumbs>` that already emits JSON-LD, gives you two.
3. **The stylesheet.** With Tailwind 4, an `@source` line whose path really leads from that stylesheet to
   `node_modules/breadcrumb-nav/dist`; without it, `import 'breadcrumb-nav/styles.css'`. If the trail renders as
   plain unstyled text, this is why.
4. **Invented settings.** Any prop or attribute not in the allowed list above. The
   [API summary](./api-summary.md) is the full list.
5. **Names for ids.** Pages like `/orders/8731` should show the order's name, passed with `pathLabels` from code
   that already has it. If the assistant added a fetch to get it, take that out.

Then follow the verification steps it gave you. The [SEO page](./seo.md) explains what each check proves.

## Stop the next assistant re-guessing all this

The prompt above is a one-off conversation. Whatever assistant you use next month starts with none of it. Most
coding assistants read a file called `AGENTS.md` in your repository root before they start work; keeping a short
section there is what makes the decisions stick. Fill in the angle brackets with what the setup chose:

```markdown
## Breadcrumbs

This project uses breadcrumb-nav. The trail is rendered once, in `<path/to/layout or shell>`, with
`baseUrl="<https://your-origin>"`. Never add a second trail or a second BreadcrumbList to a page.

- Pages with ids get real names through `pathLabels`, passed from the code that already has the name. Never fetch
  data for the trail.
- Routes are declared in `<path/to/routes.ts or "not declared">`; declare a route only when a page's parent is not
  its URL parent.
- Styling: `<the @source line in path/to/stylesheet | breadcrumb-nav/styles.css>`. Don't add both.
- Valid props, attributes and options are listed in the API summary:
  https://github.com/bronz3beard/breadcrumb-nav/blob/main/docs/api-summary.md
  If a name isn't on that page it doesn't exist; ask rather than invent one.
```

If your assistant reads a differently named file (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`),
put the same section there instead. The file name changes; the content doesn't.

## Validation record

This prompt is tested against real repositories, not just written. Each run starts from a cold assistant with no
memory of this project, against fixtures that deliberately contain an older hand-rolled breadcrumb.

<!-- Filled in by the validation runs (plan slice S8d). -->

**Last validated:** not yet. The table below is filled in when the runs are done; until then, the five checks above
are the safety net.

| Date | Assistant | Fixture | Result |
| --- | --- | --- | --- |
| | | | |

If you run it and it gets something wrong, that's a bug in this page: please
[open an issue](https://github.com/bronz3beard/breadcrumb-nav/issues) with what it produced.
