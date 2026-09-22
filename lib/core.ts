// `breadcrumb-nav/core`: framework-agnostic, dependency-free functions. Everything the adapters render comes from here.
export { buildBreadcrumbs, defineRoutes } from './core/build.js'
export {
  DEFAULT_CLASSES,
  resolveClassNames,
  type ClassNames,
} from './core/classes.js'
export { BreadcrumbError, type BreadcrumbErrorCode } from './core/errors.js'
export { renderBreadcrumbsHtml, type RenderOptions } from './core/html.js'
export {
  serializeJsonLd,
  toJsonLd,
  type BreadcrumbList,
  type BreadcrumbListItem,
} from './core/jsonld.js'
export { formatSegmentLabel } from './core/label.js'
export type { TrailingSlash } from './core/path.js'
export type {
  BuildOptions,
  Crumb,
  HomeOptions,
  Label,
  LabelContext,
  RouteDef,
  RoutePath,
} from './core/types.js'
