import { BreadcrumbError } from './errors.js'
import type { Crumb } from './types.js'

/** One entry of a schema.org BreadcrumbList. `item` is the page's absolute URL; the current page has none. */
export interface BreadcrumbListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item?: string
}

/** The structured data crawlers read: https://schema.org/BreadcrumbList */
export interface BreadcrumbList {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbListItem[]
}

const parseBaseUrl = (baseUrl: string | undefined): URL => {
  if (baseUrl === undefined) {
    throw new BreadcrumbError(
      'BASE_URL_REQUIRED',
      'baseUrl is required to emit JSON-LD, because search engines need absolute URLs. Pass your public origin, such as "https://example.com", or set jsonLd to false.',
    )
  }
  let url: URL | undefined
  try {
    url = new URL(baseUrl)
  } catch {
    url = undefined
  }
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    throw new BreadcrumbError(
      'INVALID_BASE_URL',
      `baseUrl must be an absolute http(s) URL such as "https://example.com", got ${JSON.stringify(baseUrl)}.`,
    )
  }
  return url
}

/**
 * Builds the schema.org BreadcrumbList for a trail. Positions are 1-based and consecutive; `name` is the visible
 * label; `item` is `new URL(href, baseUrl)`, so a baseUrl that carries a path is not doubled when hrefs already
 * include it. The current page is listed without `item`, which Google permits.
 */
export function toJsonLd(options: {
  crumbs: readonly Crumb[]
  baseUrl: string
}): BreadcrumbList {
  const base = parseBaseUrl(options.baseUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: options.crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.current ? {} : { item: new URL(crumb.href, base).toString() }),
    })),
  }
}

/**
 * Serialises JSON-LD for a <script> tag. `<`, `>`, `&` and the two Unicode line terminators become JSON escapes
 * (`<` and so on), which JSON.parse reads back unchanged. HTML entities would be wrong here: script content is
 * raw text, so `&amp;` would corrupt every URL with a query string.
 */
export function serializeJsonLd(jsonLd: BreadcrumbList): string {
  return JSON.stringify(jsonLd).replace(
    /[<>&\u2028\u2029]/g,
    char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'),
  )
}
