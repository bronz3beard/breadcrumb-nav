// `breadcrumb-nav`: server-safe React components plus every core function. No 'use client' banner: nothing here uses
// hooks or browser APIs. The Next.js wiring, which does, lives in `breadcrumb-nav/next`.
export * from './core.js'
export {
  BreadcrumbJsonLd,
  type BreadcrumbJsonLdProps,
} from './react/BreadcrumbJsonLd.js'
export {
  Breadcrumbs,
  type BreadcrumbsProps,
  type LinkProps,
} from './react/Breadcrumbs.js'
