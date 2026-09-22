# Reference answers for the agent-setup prompt

Written BEFORE any assistant runs, so grading is a comparison, not an impression. Each fixture has: what a correct
STEP 1 inspection must find, the answers the "user" gives in STEP 2 (the facts sheet handed to the cold assistant),
the outcome a correct STEP 3 produces, and the objective checks `grade-*.mjs` runs. A run passes when every graded
check passes, the project's own check (typecheck or build) passes, and the five human checks on the agent-setup page
find nothing.

## Fixture 1: `next-app` (Acme Forms)

Next.js 16 App Router, TypeScript, Tailwind CSS 4 with the stylesheet at `src/app/globals.css`, `metadataBase`
declared, an old client component `SiteBreadcrumbs` rendered in the root layout with its own (relative-URL) JSON-LD.

### STEP 1 must find

- Next.js App Router, server-rendered; TypeScript; npm.
- Tailwind CSS 4; global stylesheet `src/app/globals.css`.
- Existing breadcrumbs: `src/components/SiteBreadcrumbs.tsx`, used in `src/app/layout.tsx`, with a `BreadcrumbList`.
- Public URL: `https://acme-forms.example` from `metadataBase` in `src/app/layout.tsx` (also in README).
- Trailing slashes: off (`next.config.ts`).
- No base path.
- Routes: `/`, `/forms`, `/forms/[id]` (id), `/settings/profile`. Depth 2. The form name comes from `getForm(id)` in
  `src/lib/forms.ts`, already used by `src/app/forms/[id]/page.tsx`.

### STEP 2 facts sheet (the user's answers)

- Origin: `https://acme-forms.example` (confirm what the repo says).
- Ids: `/forms/[id]` should show the form's name; it is `form.name` in `src/app/forms/[id]/page.tsx`.
- Hierarchy differences: none. Hide `/settings`: it has no page of its own (only `/settings/profile`), so its crumb
  would link to a 404 (found by the large assistant in round 1; added to the facts and the grader for round 2).
- Home label: "Home".
- Styling: keep the defaults.
- Language: English.

### Correct STEP 3 outcome

- A routes declaration `defineRoutes([{ path: '/settings', hidden: true }])` passed as `routes`, so `/settings/profile`
  reads Home / Profile.
- `src/app/layout.tsx`: `SiteBreadcrumbs` import and element removed; `<Breadcrumbs baseUrl="https://acme-forms.example" />`
  from `breadcrumb-nav/next` in its place (or the server-safe `Breadcrumbs` from `breadcrumb-nav` with an explicit
  path; either is acceptable, but the Next entry is the expected choice for a layout).
- `src/app/forms/[id]/page.tsx`: the trail for this page shows the form's name. Acceptable implementations: the
  server-safe `<Breadcrumbs path={`/forms/${id}`} pathLabels={{ [`/forms/${id}`]: form.name }} baseUrl=… />` in
  the page **with the layout's trail not rendering on this page**, or (simpler and expected) the layout keeps the
  single trail and the page contributes nothing while the assistant explains the trade-off. What is NOT acceptable:
  two trails on the form page, or a `fetch` added to get the name.
  Grading accepts either: exactly one `<Breadcrumbs` renders per page, and if the page renders one, it uses
  `pathLabels` with `form.name`.
- `src/components/SiteBreadcrumbs.tsx` deleted, or at least no longer imported anywhere.
- `src/app/globals.css`: `@source "../../node_modules/breadcrumb-nav/dist";` (two levels up from `src/app/`).
- `defineRoutes` is used only for the hidden `/settings` route; no `parent` declarations are needed.
- `npm run typecheck` passes.
- The verification walkthrough names view-source, the Rich Results Test and the Tab check.

### Graded checks (`grade-next.mjs`)

1. No file imports `SiteBreadcrumbs`.
2. `src` contains no `BreadcrumbList` and no `application/ld+json` of its own (the library emits it).
3. Exactly one `<Breadcrumbs` element per page: at most one in `src/app/layout.tsx`, and if
   `src/app/forms/[id]/page.tsx` has one, the layout has none.
4. Every `baseUrl` value is `https://acme-forms.example` (literal or a constant equal to it); none is `localhost`
   or `example.com`.
5. `src/app/globals.css` contains `@source` pointing at `../../node_modules/breadcrumb-nav/dist`.
6. No `fetch(` anywhere in `src`.
7. `npx tsc --noEmit` exits 0.
8. `/settings` is declared `hidden: true` in a `defineRoutes` call and `routes` is passed.

## Fixture 2: `vite-app` (Tots Store)

Vite + React Router 7 (data router), plain JavaScript, plain CSS, no Tailwind. An old `Breadcrumbs.jsx` that keeps a
navigation history in `localStorage`. Public URL in `.env` as `VITE_SITE_URL`. One page whose place in the site is
not its URL: `/returns` belongs under Account › Orders.

### STEP 1 must find

- Vite + React Router (data router, `createBrowserRouter`), client-rendered; JavaScript; npm.
- No Tailwind; stylesheet `src/index.css`.
- Existing breadcrumbs: `src/components/Breadcrumbs.jsx`, rendered in `src/Root.jsx`, localStorage-based, no
  JSON-LD.
- Public URL: `https://tots-store.example` from `.env` (`VITE_SITE_URL`).
- Trailing slashes: none used. No base path.
- Routes: `/`, `/products`, `/products/:productId` (id), `/account`, `/account/orders`,
  `/account/orders/:orderId` (id), `/returns`. Product names from `getProduct` in `src/data/products.js`.

### STEP 2 facts sheet

- Origin: `https://tots-store.example` (use `import.meta.env.VITE_SITE_URL` or the literal; both fine).
- Ids: `/products/:productId` shows the product name (`product.name`, already in `ProductPage.jsx`);
  `/account/orders/:orderId` shows "Order #<id>".
- Hierarchy: `/returns` belongs under Account › Orders (parent `/account/orders`).
- Nothing to hide.
- Home label: "Home".
- Styling: not using Tailwind; use the plain stylesheet.
- Language: English.

### Correct STEP 3 outcome

- `src/Root.jsx`: old `Breadcrumbs` replaced by `<Breadcrumbs path={pathname} … />` from `breadcrumb-nav` with
  `pathname` from `useLocation()`, `baseUrl` set, `routes` from a `defineRoutes` declaring `/returns` with
  `parent: '/account/orders'` (and, reasonably, `/account/orders/:orderId` with a label function for "Order #id"),
  `unstyled`, and optionally `renderLink` using React Router's `Link`.
- Product name: `pathLabels` keyed by the product path with `product.name`. Because the layout renders the trail and
  the product page has the product, an acceptable pattern is the product page rendering its own trail while the
  layout skips it, or a label function on a `/products/:productId` route that looks the product up in
  `src/data/products.js` (a synchronous local module, which is not a fetch). Either is acceptable.
- `import 'breadcrumb-nav/styles.css'` once (in `main.jsx` or `Root.jsx`) and `unstyled` on the component.
- `src/components/Breadcrumbs.jsx` deleted or unused; no `localStorage` breadcrumb code remains.
- `npm run build` passes.

### Graded checks (`grade-vite.mjs`)

1. No file imports `./components/Breadcrumbs.jsx` and `src` contains no `localStorage`.
2. Exactly one `<Breadcrumbs` per page (at most one in `Root.jsx`; if `ProductPage.jsx` renders one, `Root.jsx` has
   none).
3. Every `baseUrl` is `https://tots-store.example` or `import.meta.env.VITE_SITE_URL`.
4. `breadcrumb-nav/styles.css` is imported exactly once and `unstyled` is passed.
5. A `defineRoutes` declares `/returns` with `parent: '/account/orders'`.
6. Product name reaches the trail: `product.name` (or `getProduct`) appears in a `pathLabels` or route `label`.
7. No `fetch(` anywhere in `src`.
8. `npx vite build` exits 0.

## Human checks (from docs/agent-setup.md), applied to the transcript

A. `baseUrl` is the real origin. B. One trail per page. C. Stylesheet handled. D. No invented settings (compare
every prop used against ALLOWED SETTINGS). E. Names for ids without a fetch. Plus: the assistant produced the
verification walkthrough and the not-done list, and ran the project's check.
