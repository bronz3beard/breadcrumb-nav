import { BreadcrumbError } from './errors.js'
import { splitPath, type Segment } from './path.js'
import type { RouteDef } from './types.js'

type PatternSegment =
  | { kind: 'static'; raw: string; decoded: string }
  | { kind: 'param'; name: string }
  | { kind: 'rest'; name: string }

export interface CompiledRoute {
  route: RouteDef
  segments: PatternSegment[]
  /** Per segment: static 3, param 2, rest 1. Compared left to right; the higher ranks win. */
  rank: number[]
}

export interface Match {
  route: RouteDef
  /** Decoded values, for labels. */
  params: Record<string, string>
  /** Values as written in the URL, for rebuilding hrefs. */
  raw: Record<string, string>
}

const PARAM = /^:(\w+)$|^\[(\w+)\]$/
const REST = /^\[\.\.\.(\w+)\]$|^(\*)$/

const parseSegment = (segment: Segment): PatternSegment => {
  const rest = REST.exec(segment.raw)
  if (rest) return { kind: 'rest', name: rest[1] ?? rest[2] }
  const param = PARAM.exec(segment.raw)
  if (param) return { kind: 'param', name: param[1] ?? param[2] }
  return { kind: 'static', raw: segment.raw, decoded: segment.decoded }
}

const RANK = { static: 3, param: 2, rest: 1 }

/** Parses every pattern and checks that each `parent` exists and that no parent chain loops. */
export function compileRoutes(routes: readonly RouteDef[]): CompiledRoute[] {
  const byPath = new Map(routes.map(route => [route.path, route]))
  for (const route of routes) {
    if (route.parent !== undefined && !byPath.has(route.parent)) {
      throw new BreadcrumbError(
        'UNKNOWN_PARENT',
        `route "${route.path}" names parent "${route.parent}", which is not a declared route. Declared: ${[...byPath.keys()].join(', ')}.`,
      )
    }
    const seen = new Set<string>()
    for (let step: RouteDef | undefined = route; step?.parent !== undefined;) {
      if (seen.has(step.path)) {
        throw new BreadcrumbError(
          'PARENT_CYCLE',
          `parent chain loops: ${[...seen, step.path].join(' → ')}.`,
        )
      }
      seen.add(step.path)
      step = byPath.get(step.parent)
    }
  }
  return routes.map(route => {
    const segments = splitPath(route.path, `route "${route.path}"`).map(
      parseSegment,
    )
    const restAt = segments.findIndex(segment => segment.kind === 'rest')
    if (restAt !== -1 && restAt !== segments.length - 1) {
      throw new BreadcrumbError(
        'INVALID_PATH',
        `route "${route.path}": a catch-all segment must be last.`,
      )
    }
    return { route, segments, rank: segments.map(s => RANK[s.kind]) }
  })
}

const matchOne = (
  compiled: CompiledRoute,
  segments: readonly Segment[],
): Match | undefined => {
  const params: Record<string, string> = {}
  const raw: Record<string, string> = {}
  for (let i = 0; i < compiled.segments.length; i++) {
    const pattern = compiled.segments[i]
    if (pattern.kind === 'rest') {
      const rest = segments.slice(i)
      if (rest.length === 0) return undefined
      params[pattern.name] = rest.map(s => s.decoded).join('/')
      raw[pattern.name] = rest.map(s => s.raw).join('/')
      return { route: compiled.route, params, raw }
    }
    const segment = segments[i]
    if (!segment) return undefined
    if (pattern.kind === 'static') {
      if (pattern.decoded !== segment.decoded) return undefined
    } else {
      params[pattern.name] = segment.decoded
      raw[pattern.name] = segment.raw
    }
  }
  return segments.length === compiled.segments.length
    ? { route: compiled.route, params, raw }
    : undefined
}

const outranks = (a: number[], b: number[]): boolean => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}

/** The most specific route matching the segments (static beats param beats catch-all), first declared on a tie. */
export function matchRoute(
  compiled: readonly CompiledRoute[],
  segments: readonly Segment[],
): Match | undefined {
  let best: { match: Match; rank: number[] } | undefined
  for (const candidate of compiled) {
    const match = matchOne(candidate, segments)
    if (match && (!best || outranks(candidate.rank, best.rank))) {
      best = { match, rank: candidate.rank }
    }
  }
  return best?.match
}

/** Turns a pattern back into concrete segments using the params of the page that named it as parent. */
export function resolvePattern(
  compiled: CompiledRoute,
  from: Match,
): Segment[] {
  return compiled.segments.flatMap((pattern): Segment[] => {
    if (pattern.kind === 'static') {
      return [{ raw: pattern.raw, decoded: pattern.decoded }]
    }
    const value = from.raw[pattern.name]
    if (value === undefined) {
      throw new BreadcrumbError(
        'UNKNOWN_PARENT',
        `parent "${compiled.route.path}" needs "${pattern.name}", which "${from.route.path}" does not provide.`,
      )
    }
    return splitPath('/' + value)
  })
}
