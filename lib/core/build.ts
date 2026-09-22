import { BreadcrumbError } from './errors.js'
import { formatSegmentLabel } from './label.js'
import { joinPath, normalisePath, splitPath, type Segment } from './path.js'
import type { BuildOptions, Crumb, Label, LabelContext } from './types.js'

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

const startsWithSegments = (
  segments: readonly Segment[],
  prefix: readonly Segment[],
): boolean =>
  prefix.every((segment, i) => segments[i]?.decoded === segment.decoded)

/**
 * Derives the breadcrumb trail for a pathname: Home, then one crumb per segment, the last one marked current.
 * Pure: same input, same output, nothing touched.
 */
export function buildBreadcrumbs(options: BuildOptions): Crumb[] {
  const {
    path,
    basePath,
    home,
    pathLabels,
    formatLabel,
    trailingSlash = 'never',
  } = options

  const base = basePath ? splitPath(basePath, 'basePath') : []
  const segments = splitPath(path)
  if (!startsWithSegments(segments, base)) {
    throw new BreadcrumbError(
      'INVALID_PATH',
      `path "${path}" is outside basePath "${basePath}".`,
    )
  }
  const below = segments.slice(base.length)
  const labelFor = indexPathLabels(pathLabels, trailingSlash)
  const crumbs: Crumb[] = []

  if (home !== false) {
    const href = home?.href
      ? normalisePath(home.href, trailingSlash, 'home.href')
      : joinPath(base, trailingSlash)
    const context = { segment: '', params: {}, path: href }
    const override = labelFor.get(href)
    crumbs.push({
      href,
      label:
        override !== undefined
          ? resolve(override, context)
          : (home?.label ?? 'Home'),
      current: below.length === 0,
      params: {},
    })
  }

  below.forEach((segment, i) => {
    const href = joinPath([...base, ...below.slice(0, i + 1)], trailingSlash)
    const context: LabelContext = {
      segment: segment.decoded,
      params: {},
      path: href,
    }
    const override = labelFor.get(href)
    crumbs.push({
      href,
      label:
        override !== undefined
          ? resolve(override, context)
          : formatLabel
            ? formatLabel(context)
            : formatSegmentLabel(segment.decoded),
      current: i === below.length - 1,
      params: {},
    })
  })

  return crumbs
}
