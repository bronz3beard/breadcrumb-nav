# Prompt validation runs

Raw run directories (each assistant's modified fixture copy) stayed in the gitignored `.loop-out` folder of the run;
this file, the fixtures, the facts sheets, the reference answers and the graders were moved here on 2026-09-22 so the
validation can be repeated. See README.md in this directory.

Method: six cold runs per round (small, mid-size and large assistant from one vendor, each on both fixtures), each in
a fresh copy of the fixture with the prompt extracted verbatim from `docs/agent-setup.md` and a facts sheet standing
in for the developer's answers. Graded by `grade-next.mjs` / `grade-vite.mjs` plus the five human checks on the
agent-setup page. Any defect found becomes a prompt rule, and the whole round is rerun from scratch. Pass = a full
round with no prompt edits between runs.

## Round 1 — 2026-09-22, prompt as first written

| Run | Grader | Failures | Human checks |
| --- | --- | --- | --- |
| small / Next.js | FAIL (2) | 1 old component still imported; 3 no trail in layout — it rewrote `SiteBreadcrumbs.tsx` in place as a wrapper | A ok, B ok, C ok, D ok (redundant `home`, `trailingSlash` defaults, allowed), E ok |
| small / Vite | FAIL (2) | 1 old component file rewritten in place as a wrapper; 4 `unstyled` not passed with styles.css | A ok, B ok, C partial (stylesheet yes, `unstyled` no), D ok in code but the REPORT invents class names (`breadcrumb-nav__list`) that do not exist, E ok (synchronous lookups, no fetch) |
| mid / Next.js | PASS | none | A ok (one SITE_URL constant shared with metadataBase), B ok, C ok, D ok (only baseUrl + pathLabels), E ok. Deleted the old file and its empty directory; noted and reverted an unrelated tsconfig rewrite by next build |
| mid / Vite | PASS | none | A ok (import.meta.env.VITE_SITE_URL), B ok, C ok (styles.css once + unstyled), D ok (path, routes, pathLabels, baseUrl, unstyled), E ok (useMatches params + local module). Declared only the two routes the parent needs; removed the orphaned CSS rule; ran buildBreadcrumbs directly to confirm three trails |
| large / Next.js | PASS | none | A ok, B ok (counted BreadcrumbList in built HTML: 1, 1, 0 on root), C ok (confirmed utilities in built CSS), D ok (four names), E ok. Found a real fixture issue: /settings has no page, so the inferred crumb links to a 404; it refused to guess and listed it as undone — the prompt should ask about this |
| large / Vite | PASS (after a grader fix) | the grader counted a CSS comment mentioning styles.css as a second import; fixed to count import statements | A ok (VITE_SITE_URL), B ok, C ok, D ok (renderLink with LinkProps spread), E ok. Raised that a client-only SPA has no trail in its server HTML, so "view source" in the walkthrough is wrong for it — a prompt defect |

### Defects found so far → prompt changes for round 2

1. "Replace" was read as "rewrite the old file". Rule to add: delete the old breadcrumb files and render the
   package's component directly where they were rendered; never rewrite the old component in place, never wrap.
2. `unstyled` alongside `styles.css` was missed once. Add it to the STEP 4 self-check as its own line.
3. A report described rendered markup and class names from memory. Rule to add: never describe rendered HTML or
   class names you have not seen; point at view-source instead.
5. The verification walkthrough assumed server-rendered HTML. For client-only apps it must point at the rendered
   DOM and the Rich Results Test by URL, and say plainly that non-JavaScript crawlers see nothing.
4. Ancestor URLs with no page of their own (e.g. /settings when only /settings/profile exists) become crumbs that
   link to a 404. STEP 1 should look for them and STEP 2 should ask; the answer is a hidden route. The Next.js facts
   sheet and grader gain this case for round 2.

**Round 1 result: 4 of 6 pass** (small assistant failed both; mid and large passed both). Five prompt changes made;
the Next.js facts and grader gained the hidden-ancestor case. Round 2 reruns all six from clean fixtures.

## Round 2 — 2026-09-22, prompt with the five round-1 rules

| Run | Grader | Failures | Human checks |
| --- | --- | --- | --- |
| small / Next.js | FAIL (1) | 9 wrapper: created `src/app/breadcrumbs.tsx` exporting its own `Breadcrumbs` and rendered that from the layout, while stating "no wrapper component" in its report. Everything else right, incl. hidden /settings. (Grader gained wrapper detection after this run exposed a blind spot: a same-named wrapper passed check 3.) | A ok, B ok, C ok, D ok (redundant `home`, labels for every route), E ok |
| small / Vite | FAIL (1) | 4 `unstyled` not passed (it wrote "No unstyled prop passed" in its own self-check, i.e. it read the rule and chose otherwise). Wrapper mistake gone; old file deleted; renderLink with Link; CSR caveat in the walkthrough | A ok, B ok, C partial, D ok, E ok |
| mid / Next.js | PASS (9/9) | none | A ok, B ok (curl against next start: 1, 1, 1, 0 on root), C ok, D ok, E ok. defineRoutes inline in the layout for the one hidden route; deleted the old file; disclosed the tsconfig rewrite by next build |
| mid / Vite | PASS (9/9) | none | A ok (VITE_SITE_URL), B ok, C ok, D ok, E ok. Read react-router source to learn a layout cannot see child params and derived the id from the pathname instead; hit UNKNOWN_PARENT when declaring only /returns and fixed it by declaring the parent too (documented behaviour); ran buildBreadcrumbs for all seven routes; CSR limitation stated |
| large / Next.js | PASS (9/9) | none | A ok (one siteUrl constant shared with metadataBase), B ok (counted in served HTML), C ok (utilities confirmed in built CSS), D ok, E ok. Hid /settings via defineRoutes; deleted the old file; flagged the mb-4 spacing change and the layout-level pathLabels as a judgement call |
| large / Vite | PASS (9/9) | none | A ok, B ok, C ok (styles.css once + unstyled), D ok, E ok. Walkthrough written for a client-only SPA ("do not use View Source"), CSR limitation in the not-done list, verified data-crumb hooks survive unstyled by reading the chunk |

**Round 2 result: 4 of 6 pass, with no prompt edits between runs** — the mid-size and large assistants pass all
nine graded checks and the five human checks on both fixtures. The small assistant fails both runs, each time on a
rule it had read: it created a wrapper component under a new name while writing "no wrapper component" in its
report, and it skipped `unstyled` while writing "No unstyled prop passed" in its self-check. Both are rules it
chose to override rather than gaps in the prompt, so a third round was not run; the limitation is stated on the
agent-setup page instead: use a mid-size or larger assistant, or apply the five human checks strictly.

Grader corrections made during round 2 (they change what is measured, not the prompt): styles.css counted by
import statements rather than mentions (a CSS comment had produced a false failure); `routes=` accepted anywhere
in `src`; wrapper detection added after a same-named wrapper passed the one-trail check.

Environment note: the sub-agent harness refused to write REPORT.md in some runs ("report files"), so those
assistants returned the report as their final message instead. This has no bearing on the prompt.
