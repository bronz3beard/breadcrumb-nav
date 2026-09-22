// Compile-time assertions, checked by `tsc --noEmit` (the typecheck script). Not a vitest file and not emitted.
// Each `@ts-expect-error` line FAILS the build if the error it expects stops occurring.
import {
  buildBreadcrumbs,
  defineRoutes,
  type RouteDef,
  type RoutePath,
} from '../core.js'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T

const routes = defineRoutes([
  { path: '/forms' },
  { path: '/forms/:id', parent: '/forms' },
])

// defineRoutes keeps the literal paths.
export type PathsAreLiteral = Expect<
  Equal<RoutePath<typeof routes>, '/forms' | '/forms/:id'>
>

// labels keyed by a declared pattern compile.
buildBreadcrumbs({ path: '/forms/1', routes, labels: { '/forms': 'Forms' } })

buildBreadcrumbs({
  path: '/forms/1',
  routes,
  // @ts-expect-error a key that is not a declared route pattern
  labels: { '/typo': 'Typo' },
})

buildBreadcrumbs({
  path: '/forms',
  // @ts-expect-error labels need routes (use pathLabels for concrete paths)
  labels: { '/forms': 'Forms' },
})

// @ts-expect-error a parent must be a declared path
defineRoutes([{ path: '/a' }, { path: '/b', parent: '/typo' }])

// A plain RouteDef[] (JavaScript users, or no defineRoutes) widens keys to string and still type-checks;
// the runtime check catches unknown keys instead.
const plain: RouteDef[] = [{ path: '/x' }]
buildBreadcrumbs({ path: '/x', routes: plain, labels: { '/anything': 'Ok' } })

// pathLabels keys must look like paths.
buildBreadcrumbs({
  path: '/x',
  // @ts-expect-error a key without a leading slash
  pathLabels: { x: 'X' },
})
