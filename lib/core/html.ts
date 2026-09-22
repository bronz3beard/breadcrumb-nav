import { resolveClassNames, type ClassNames } from './classes.js'
import { serializeJsonLd, toJsonLd } from './jsonld.js'
import type { Crumb } from './types.js'

export interface RenderOptions {
  crumbs: readonly Crumb[]
  /** Your public origin, such as "https://example.com". Required unless `jsonLd` is false. */
  baseUrl?: string
  /** Emit the BreadcrumbList <script>. Default true. */
  jsonLd?: boolean
  /** Text between crumbs, hidden from assistive technology. Default "/". */
  separator?: string
  /** Classes added to the defaults, per part. */
  classNames?: Partial<ClassNames>
  /** Drop the default classes and use only `classNames`. */
  unstyled?: boolean
  /** The accessible name of the <nav>. Default "Breadcrumb". Translate it for non-English sites. */
  ariaLabel?: string
  /** Render a one-crumb trail (the site root). Default false: a trail of one item tells crawlers nothing. */
  renderOnRoot?: boolean
}

const escapeHtml = (text: string): string =>
  text.replace(
    /[&<>"]/g,
    char =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[
        char
      ] as string,
  )

const attr = (name: string, value: string): string =>
  value ? ` ${name}="${escapeHtml(value)}"` : ''

/**
 * The trail as an HTML string, for server rendering outside React (Angular SSR, Astro, Eleventy, plain Node
 * templates). Same markup as the React component and the custom element: a <nav> landmark with an accessible name,
 * an ordered list, real links for ancestors, `aria-current="page"` on the current page, separators hidden from
 * assistive technology, and the BreadcrumbList JSON-LD in a <script> after the <nav>.
 */
export function renderBreadcrumbsHtml(options: RenderOptions): string {
  const {
    crumbs,
    baseUrl,
    jsonLd = true,
    separator = '/',
    ariaLabel = 'Breadcrumb',
    renderOnRoot = false,
  } = options
  const script = jsonLd
    ? `<script type="application/ld+json">${serializeJsonLd(toJsonLd({ crumbs, baseUrl: baseUrl as string }))}</script>`
    : ''
  if (crumbs.length < 2 && !renderOnRoot) return ''
  const cls = resolveClassNames(options)
  const items = crumbs.map(crumb =>
    crumb.current
      ? `<li${attr('class', cls.item)} data-crumb="item"><span${attr('class', cls.current)} data-crumb="current" aria-current="page">${escapeHtml(crumb.label)}</span></li>`
      : `<li${attr('class', cls.item)} data-crumb="item"><a href="${escapeHtml(crumb.href)}"${attr('class', cls.link)} data-crumb="link">${escapeHtml(crumb.label)}</a><span aria-hidden="true"${attr('class', cls.separator)} data-crumb="separator">${escapeHtml(separator)}</span></li>`,
  )
  return `<nav aria-label="${escapeHtml(ariaLabel)}"${attr('class', cls.nav)} data-crumb="nav"><ol${attr('class', cls.list)} data-crumb="list">${items.join('')}</ol></nav>${script}`
}
