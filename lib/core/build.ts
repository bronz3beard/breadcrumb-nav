import { BreadcrumbError } from './errors.js'
import { formatSegmentLabel } from './label.js'
import { joinPath, normalisePath, splitPath, type Segment } from './path.js'
import {
  compileRoutes,
  matchRoute,
  resolvePattern,
  type CompiledRoute,
  type Match,
} from './routes.js'
import type {
  BuildOptions,
  Crumb,
  Label,
  LabelContext,
  RouteDef,
} from './types.js'

const resolve = (label: Label, context: LabelContext): string =>
  typeof label === 'function' ? label(context) : label

/** Normalises every key once, so lookups compare canonical spellings under the chosen trailing-slash policy. */
const indexPathLabels = (
  pathLabels: BuildOptions['pathLabels'],
  trailingSlash: 'never' | 'always',
): Map<string, Label> => {
  const index = new Map<string, Label>()
  for (const [key, label] of Object.entries(pathLabels ?? {})) {
    index.set(normalisePath(key, trailingSlash, 'pathLabels key'), label)
  }
  return index
}

/** Every key must be a declared pattern: a typo would otherwise be a silent no-op. */
const indexLabels = (
  labels: Record<string, Label | undefined> | undefined,
  routes: readonly RouteDef[],
): Map<string, Label> => {
  const declared = new Set(routes.map(route => route.path))
  const index = new Map<string, Label>()
  for (const [pattern, label] of Object.entries(labels ?? {})) {
    if (label === undefined) continue
    if (!declared.has(pattern)) {
      throw new BreadcrumbError(
        'LABEL_WITHOUT_ROUTE',
        `labels key "${pattern}" is not a declared route. Declared: ${[...declared].join(', ')}. For a concrete path, use pathLabels.`,
      )
    }
    index.set(pattern, label)
  }
  return index
}

const startsWithSegments = (
  segments: readonly Segment[],
  prefix: readonly Segment[],
): boolean =>
  prefix.every((segment, i) => segments[i]?.decoded === segment.decoded)

interface Draft extends Crumb {
  /** Hidden route, or undeclared ancestor in strict mode: dropped unless it is the current page. */
  omit: boolean
}

/**
 * Derives the breadcrumb trail for a pathname. Without routes: Home, then one crumb per URL segment. With routes: the
 * same, except that a matched page whose route names a `parent` takes that parent's trail instead of its URL
 * ancestors, and this applies at every level, so any declared hierarchy of any depth is honoured. The last crumb is
 * the current page. Pure: same input, same output, nothing touched.
 */
export function buildBreadcrumbs<T extends readonly RouteDef[] = never>(
  options: BuildOptions<T>,
): Crumb[] {
  const {
    path,
    routes,
    labels,
    pathLabels,
    home,
    basePath,
    strict = false,
    formatLabel,
    trailingSlash = 'never',
  } = options

  if (labels && !routes) {
    throw new BreadcrumbError(
      'LABELS_REQUIRE_ROUTES',
      'labels are keyed by route pattern, so they need routes. For concrete paths, use pathLabels.',
    )
  }
  const compiled = routes ? compileRoutes(routes) : []
  const labelByPattern = indexLabels(
    labels as Record<string, Label | undefined> | undefined,
    routes ?? [],
  )
  const labelByHref = indexPathLabels(pathLabels, trailingSlash)

  const base = basePath ? splitPath(basePath, 'basePath') : []
  const segments = splitPath(path)
  if (!startsWithSegments(segments, base)) {
    throw new BreadcrumbError(
      'INVALID_PATH',
      `path "${path}" is outside basePath "${basePath}".`,
    )
  }

  const crumbFor = (segs: readonly Segment[], match?: Match): Draft => {
    const isRoot = segs.length === base.length
    const href =
      isRoot && home && home.href
        ? normalisePath(home.href, trailingSlash, 'home.href')
        : joinPath(segs, trailingSlash)
    const context: LabelContext = {
      segment: segs[segs.length - 1]?.decoded ?? '',
      params: match?.params ?? {},
      path: href,
    }
    const override =
      labelByHref.get(href) ??
      (match && labelByPattern.get(match.route.path)) ??
      match?.route.label
    const label =
      override !== undefined
        ? resolve(override, context)
        : isRoot
          ? ((home ? home.label : undefined) ?? 'Home')
          : formatLabel
            ? formatLabel(context)
            : formatSegmentLabel(context.segment)
    return {
      href,
      label,
      current: false,
      ...(match && { pattern: match.route.path }),
      params: context.params,
      omit: Boolean(match?.route.hidden) || (strict && !match && !isRoot),
    }
  }

  const trailFor = (
    segs: readonly Segment[],
    chain: ReadonlySet<string>,
  ): Draft[] => {
    if (segs.length < base.length) return []
    const match = matchRoute(compiled, segs)
    if (match?.route.parent !== undefined) {
      if (chain.has(match.route.path)) {
        throw new BreadcrumbError(
          'PARENT_CYCLE',
          `parent chain loops through "${match.route.path}".`,
        )
      }
      const parent = compiled.find(
        c => c.route.path === match.route.parent,
      ) as CompiledRoute
      const ancestors = trailFor(
        resolvePattern(parent, match),
        new Set(chain).add(match.route.path),
      )
      return [...ancestors, crumbFor(segs, match)]
    }
    if (segs.length === base.length) {
      return home === false ? [] : [crumbFor(segs, match)]
    }
    return [...trailFor(segs.slice(0, -1), chain), crumbFor(segs, match)]
  }

  const drafts = trailFor(segments, new Set())
  const crumbs: Crumb[] = []
  drafts.forEach(({ omit, ...crumb }, i) => {
    const isCurrent = i === drafts.length - 1
    if (isCurrent || !omit) crumbs.push({ ...crumb, current: isCurrent })
  })
  return crumbs
}

/**
 * Declares routes with their literal types kept, so `labels` keys and `parent` values are checked by the compiler.
 * A `parent` that is not a declared path is a compile error (the second parameter exists only to carry that error)
 * and a runtime UNKNOWN_PARENT; a parent chain that loops is a runtime PARENT_CYCLE.
 */
export function defineRoutes<const T extends readonly RouteDef[]>(
  routes: T,
  ...guard: [BadParents<T>] extends [never]
    ? []
    : [error: `parent is not a declared path: ${BadParents<T>}`]
): T {
  void guard
  compileRoutes(routes)
  return routes
}

type BadParents<T extends readonly RouteDef[]> = Exclude<
  Extract<T[number], { parent: string }>['parent'],
  T[number]['path']
>
