import { BreadcrumbError } from './errors.js'

export type TrailingSlash = 'never' | 'always'

/** One path segment, kept both as written (for hrefs) and decoded (for labels and comparisons). */
export interface Segment {
  raw: string
  decoded: string
}

const decodeSegment = (raw: string, what: string): string => {
  try {
    return decodeURIComponent(raw)
  } catch {
    throw new BreadcrumbError(
      'INVALID_PATH',
      `${what} contains a malformed percent-encoding: "${raw}".`,
    )
  }
}

/**
 * Splits a pathname into segments. Drops the query string and hash, collapses repeated slashes, and decodes each
 * segment. Throws INVALID_PATH for anything that is not a pathname starting with "/".
 */
export function splitPath(path: string, what = 'path'): Segment[] {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new BreadcrumbError(
      'INVALID_PATH',
      `${what} must be a string starting with "/", got ${JSON.stringify(path)}. Pass a pathname such as "/docs/guides", not a full URL.`,
    )
  }
  const bare = path.split(/[?#]/, 1)[0]
  return bare
    .split('/')
    .filter(Boolean)
    .map(raw => ({ raw, decoded: decodeSegment(raw, what) }))
}

/** Joins segments back into an href using their original spelling. The root is always "/". */
export function joinPath(
  segments: readonly Segment[],
  trailingSlash: TrailingSlash,
): string {
  if (segments.length === 0) return '/'
  const joined = '/' + segments.map(segment => segment.raw).join('/')
  return trailingSlash === 'always' ? joined + '/' : joined
}

/** `joinPath(splitPath(path))`: the canonical spelling this package compares paths by. */
export function normalisePath(
  path: string,
  trailingSlash: TrailingSlash,
  what = 'path',
): string {
  return joinPath(splitPath(path, what), trailingSlash)
}
