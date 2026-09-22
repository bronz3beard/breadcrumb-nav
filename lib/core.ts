// `breadcrumb-nav/core`: framework-agnostic, dependency-free functions. Everything the adapters render comes from here.
export { buildBreadcrumbs } from './core/build.js'
export { BreadcrumbError, type BreadcrumbErrorCode } from './core/errors.js'
export { formatSegmentLabel } from './core/label.js'
export type { TrailingSlash } from './core/path.js'
export type {
  BuildOptions,
  Crumb,
  HomeOptions,
  Label,
  LabelContext,
} from './core/types.js'
