import type { TrailingSlash } from './path.js'

/** What a label function receives: the decoded segment, the matched route params and the crumb's own path. */
export interface LabelContext {
  segment: string
  params: Record<string, string>
  path: string
}

/** A label is a string, or a function of the crumb it labels. */
export type Label = string | ((context: LabelContext) => string)

export interface RouteDef {
  /**
   * A path pattern. Static segments, `:id` or `[id]` for one dynamic segment, `[...rest]` or `*` for the remainder,
   * so Next.js file routes can be pasted as they are. Patterns are absolute, including any `basePath`.
   */
  path: string
  /** The label for pages matching this pattern. Omitted → inferred from the last segment. */
  label?: Label
  /**
   * The pattern of the logical parent, when the hierarchy is not the URL hierarchy. Chains as deep as you like.
   * `defineRoutes` checks it is a declared path, at compile time and at runtime.
   */
  parent?: string
  /** Leave this page out of the trail when it is an ancestor of the current page. */
  hidden?: boolean
}

/** The union of declared route paths, for keying `labels`. */
export type RoutePath<T extends readonly RouteDef[]> = T[number]['path']

export interface HomeOptions {
  /** Defaults to "Home". */
  label?: string
  /** Defaults to `basePath`, or "/" without one. */
  href?: string
}

export interface BuildOptions<T extends readonly RouteDef[] = never> {
  /** The pathname to describe. Query string and hash are ignored. Must start with "/". */
  path: string
  /** Declared routes, ideally from `defineRoutes()` so `labels` and `parent` are type-checked. */
  routes?: T
  /**
   * Labels keyed by declared route pattern, such as `{ '/forms/:id': 'Form' }`. Needs `routes`: a key that is not a
   * declared pattern is a compile error with `defineRoutes`, and throws LABEL_WITHOUT_ROUTE at runtime.
   */
  labels?: [T] extends [never] ? never : Partial<Record<RoutePath<T>, Label>>
  /**
   * Labels keyed by concrete path, such as `{ '/forms/42': 'Expense claim' }`. Keys are matched against each
   * crumb's href after normalisation, so one app-wide map can cover every page; keys for other pages are ignored.
   */
  pathLabels?: Record<`/${string}`, Label>
  /** The first crumb. `false` removes it. */
  home?: HomeOptions | false
  /** A prefix the whole app lives under, such as "/docs". Crumbs start below it and Home points at it. */
  basePath?: string
  /** Leave out ancestors that match no declared route. The current page is always shown. Default false. */
  strict?: boolean
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
  /** The declared route pattern this crumb matched, if any. */
  pattern?: string
  params: Record<string, string>
}
