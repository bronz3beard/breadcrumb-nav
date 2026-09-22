// `breadcrumb-nav/next`: the React component with `path` read from Next.js and links rendered by next/link.
// This is a client component (the build adds the 'use client' banner) because usePathname is a hook; Next.js still
// renders it on the server, so the trail and its JSON-LD are in the HTML crawlers receive.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { RouteDef } from './core/types.js'
import {
  Breadcrumbs as BaseBreadcrumbs,
  type BreadcrumbsProps,
  type LinkProps,
} from './react/Breadcrumbs.js'

/** `Omit` that keeps a union's members apart, so the baseUrl-or-jsonLd rule survives. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

export type NextBreadcrumbsProps<T extends readonly RouteDef[] = never> =
  DistributiveOmit<BreadcrumbsProps<T>, 'path'> & {
    /** Defaults to the current pathname from usePathname(). */
    path?: string
  }

const nextLink = ({ href, ...rest }: LinkProps) => (
  <Link href={href} {...rest} />
)

/** <Breadcrumbs> for Next.js: the pathname comes from the router and ancestors are next/link links. */
export function Breadcrumbs<T extends readonly RouteDef[] = never>(
  props: NextBreadcrumbsProps<T>,
) {
  const pathname = usePathname()
  const { path = pathname ?? '/', renderLink = nextLink, ...rest } = props
  return (
    <BaseBreadcrumbs
      {...(rest as BreadcrumbsProps<T>)}
      path={path}
      renderLink={renderLink}
    />
  )
}

export { BreadcrumbJsonLd } from './react/BreadcrumbJsonLd.js'
export type { BreadcrumbsProps, LinkProps } from './react/Breadcrumbs.js'
