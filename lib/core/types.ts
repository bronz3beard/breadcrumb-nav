import type { TrailingSlash } from './path.js'

/** What a label function receives: the decoded segment and the crumb's own path. */
export interface LabelContext {
  segment: string
  params: Record<string, string>
  path: string
}

/** A label is a string, or a function of the crumb it labels. */
export type Label = string | ((context: LabelContext) => string)

export interface HomeOptions {
  /** Defaults to "Home". */
  label?: string
  /** Defaults to `basePath`, or "/" without one. */
  href?: string
}

export interface BuildOptions {
  /** The pathname to describe. Query string and hash are ignored. Must start with "/". */
  path: string
  /**
   * Labels keyed by concrete path, such as `{ '/forms/42': 'Expense claim' }`. Keys are matched against each
   * crumb's href after normalisation, so one app-wide map can cover every page; keys for other pages are ignored.
   */
  pathLabels?: Record<`/${string}`, Label>
  /** The first crumb. `false` removes it. */
  home?: HomeOptions | false
  /** A prefix the whole app lives under, such as "/docs". Crumbs start below it and Home points at it. */
  basePath?: string
  /** Replaces the built-in label inference for segments that have no other label. */
  formatLabel?: (context: LabelContext) => string
  /** Whether hrefs end in "/". Match your site's canonical URLs. Default "never". */
  trailingSlash?: TrailingSlash
}

export interface Crumb {
  /** Path only, never an origin. */
  href: string
  label: string
  /** True for exactly one crumb: the last. */
  current: boolean
  params: Record<string, string>
}
