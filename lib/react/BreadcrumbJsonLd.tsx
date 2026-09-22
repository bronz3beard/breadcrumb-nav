import {
  serializeJsonLd,
  toJsonLd,
  type BreadcrumbList,
} from '../core/jsonld.js'
import type { Crumb } from '../core/types.js'

/**
 * The one place this package writes raw HTML. React escapes children, and HTML entities are not decoded inside a
 * <script>, so JSON-LD can only be emitted with dangerouslySetInnerHTML. The string comes from serializeJsonLd,
 * which escapes `<`, `>` and `&` as JSON unicode escapes, so nothing in a label can close the tag.
 */
export function JsonLdScript({ jsonLd }: { jsonLd: BreadcrumbList }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  )
}

export interface BreadcrumbJsonLdProps {
  crumbs: readonly Crumb[]
  /** Your public origin, such as "https://example.com". */
  baseUrl: string
}

/**
 * The BreadcrumbList structured data on its own, for placing it somewhere other than next to the trail (for example
 * in a layout's <head> while the visible trail lives in the page). Use this OR the `jsonLd` prop of <Breadcrumbs>,
 * never both, so each page carries one list.
 */
export function BreadcrumbJsonLd({ crumbs, baseUrl }: BreadcrumbJsonLdProps) {
  return <JsonLdScript jsonLd={toJsonLd({ crumbs, baseUrl })} />
}
