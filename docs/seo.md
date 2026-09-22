# SEO

What breadcrumbs do for search, what this package emits, and how to check it on a real page. You do not need to know
any of this to use the package; it is here so you can trust it, and explain it.

## Why breadcrumbs matter to search engines

A crawler sees your site one page at a time. A breadcrumb trail tells it where each page sits: this is a product,
inside a category, inside a shop. Search engines use that to understand your site's structure, to pass importance
between related pages, and to show the trail in results instead of the raw URL. A result that reads
**Shop › Kitchen › Kettles** gets more clicks than `example.com/c/12/p/4471`.

Two things have to be true for that to work: the trail must be in the HTML as real links, and it must be described in
a form a machine can read without guessing. The second part is structured data.

## What JSON-LD is

Structured data is a small block of machine-readable facts about the page, placed in the HTML alongside the
human-readable content. JSON-LD is the format Google recommends for it: plain JSON inside a `<script>` tag that
browsers ignore and crawlers read.

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
      { "@type": "ListItem", "position": 2, "name": "Forms", "item": "https://example.com/forms" },
      { "@type": "ListItem", "position": 3, "name": "Expense claim" }
    ]
  }
</script>
```

Reading it line by line: `@context` says the vocabulary is [schema.org](https://schema.org/BreadcrumbList), the
shared dictionary search engines agree on. `@type` says this block describes a breadcrumb list. Each `ListItem` is one
crumb with its `position` (counting from 1), its visible `name`, and its full address as `item`. The last item has no
`item` because it is the page you are on. That is the whole thing; there is no registration, no account and no
tooling, just this block in the page.

## What the package emits

Two things, from one list of crumbs, so they can never disagree:

**The visible trail**, as accessible HTML:

- A `<nav>` with `aria-label="Breadcrumb"`: a landmark that screen readers can jump to and crawlers recognise.
- An ordered list, `<ol>`, because a trail has an order.
- A real `<a href>` for every ancestor. Real links are what crawlers follow and what keyboard users tab through.
- The current page as text with `aria-current="page"`, not a link: linking a page to itself helps nobody.
- Separators inside `aria-hidden` spans, so screen readers do not read "slash" between every word.

**The structured data**, as the JSON-LD block above, right after the `<nav>`. Its names are the labels on screen and
its addresses are the links' targets made absolute with your `baseUrl`. This is why `baseUrl` is required: search
engines only accept absolute addresses here, and only you know your domain.

## The rules it follows

| Rule | Why |
| --- | --- |
| `item` addresses are absolute, from `baseUrl` | Google requires it; relative addresses are ignored |
| The last item has no `item` | Google allows it, and it avoids a self-link |
| Positions count from 1 with no gaps, even when a route is hidden | Required by the format |
| Names in the JSON equal the labels on screen | Google checks that the two match; a mismatch can be treated as spam |
| Nothing is emitted for a one-crumb trail | A trail of just "Home" is noise; some tools flag it as an error |
| One `BreadcrumbList` per page by default | Multiple trails are allowed but rarely wanted; render one component per page |
| Special characters are escaped as JSON escapes, never HTML entities | Script content is raw text; `&amp;` would corrupt every address with a query string |
| The visible markup and the JSON come from the same crumbs | A mismatch cannot be introduced by a code change in one place |

## Things only you can get right

- **`baseUrl` is your public origin**, with the scheme: `https://example.com`. Not `localhost`, not a staging domain
  in production, not a path. A `baseUrl` with a path is accepted (for a site served under `/docs`, say) but the origin
  alone is almost always what you want.
- **Match your canonical URLs.** If your site ends URLs with `/`, set `trailingSlash: 'always'` so the addresses in
  the structured data are the ones you canonicalise.
- **Render on the server** where you can. Google executes JavaScript, but not immediately and not always. The React
  component is server-safe, the Next.js entry is server-rendered, and `renderBreadcrumbsHtml()` covers other
  servers. The custom element renders in the browser only; on a server-rendered page, use the HTML string for the
  initial render.
- **Real names for ids.** A crumb called "42" is correct but tells a searcher nothing. `pathLabels` fixes it; see
  [routes and labels](./routes-and-labels.md).
- **One trail per page.** If you place `<BreadcrumbJsonLd>` yourself, turn `jsonLd` off on the component.

## Checking a page

1. **View the page source** in your browser (not the element inspector, which shows the page after JavaScript ran).
   Find `aria-label="Breadcrumb"` and, just after the `</nav>`, the `application/ld+json` script.
2. **[Google's Rich Results Test](https://search.google.com/test/rich-results).** Paste the page's public URL, or
   the HTML source for a page that is not public yet. It should list one **Breadcrumbs** item, expandable to show
   each crumb's name and address, with no errors or warnings.
3. **Google Search Console**, once the site is live: the Enhancements section reports breadcrumb items found across
   the site and any problems, a few days after crawling.
4. **The [Schema Markup Validator](https://validator.schema.org/)** checks the JSON against the schema.org vocabulary
   without Google's extra rules, useful for the last word on the format itself.

## What this package does not do

It does not add breadcrumbs to your sitemap, set canonical tags, or tell search engines to recrawl. It does not
generate the trail on the server for the custom element. And it cannot make a good hierarchy out of a bad URL
structure: declare routes with `parent` when the URL does not say where a page belongs.
