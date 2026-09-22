// The one markup fixture every renderer is tested against, so React, the custom element and the HTML string cannot
// drift apart. Not emitted (excluded in tsconfig.build.json) and not a test file.
import { DEFAULT_CLASSES } from '../core/classes.js'
import type { BreadcrumbList } from '../core/jsonld.js'
import type { Crumb } from '../core/types.js'

export const FIXTURE_BASE_URL = 'https://example.com'

export const FIXTURE_CRUMBS: Crumb[] = [
  { href: '/', label: 'Home', current: false, params: {} },
  { href: '/forms', label: 'Forms', current: false, params: {} },
  { href: '/forms/42', label: 'Expense claim', current: true, params: {} },
]

export const FIXTURE_JSON_LD: BreadcrumbList = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://example.com/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Forms',
      item: 'https://example.com/forms',
    },
    { '@type': 'ListItem', position: 3, name: 'Expense claim' },
  ],
}

const c = DEFAULT_CLASSES
export const FIXTURE_NAV_HTML =
  `<nav aria-label="Breadcrumb" class="${c.nav}" data-crumb="nav">` +
  `<ol class="${c.list}" data-crumb="list">` +
  `<li class="${c.item}" data-crumb="item"><a href="/" class="${c.link}" data-crumb="link">Home</a><span aria-hidden="true" class="${c.separator}" data-crumb="separator">/</span></li>` +
  `<li class="${c.item}" data-crumb="item"><a href="/forms" class="${c.link}" data-crumb="link">Forms</a><span aria-hidden="true" class="${c.separator}" data-crumb="separator">/</span></li>` +
  `<li class="${c.item}" data-crumb="item"><span class="${c.current}" data-crumb="current" aria-current="page">Expense claim</span></li>` +
  `</ol></nav>`

export const FIXTURE_SCRIPT_HTML = `<script type="application/ld+json">${JSON.stringify(FIXTURE_JSON_LD)}</script>`

/** Extracts and parses the JSON-LD from rendered HTML, or returns undefined when there is no script. */
export const jsonLdIn = (html: string): BreadcrumbList | undefined => {
  const match = /<script type="application\/ld\+json">([^]*?)<\/script>/.exec(
    html,
  )
  return match ? (JSON.parse(match[1]) as BreadcrumbList) : undefined
}
