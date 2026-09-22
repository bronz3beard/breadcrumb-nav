import type { ReactNode } from 'react'
import { buildBreadcrumbs } from '../core/build.js'
import { resolveClassNames, type ClassNames } from '../core/classes.js'
import { toJsonLd } from '../core/jsonld.js'
import type { BuildOptions, RouteDef } from '../core/types.js'
import { JsonLdScript } from './BreadcrumbJsonLd.js'

/** What `renderLink` receives. Spread it onto your router's link so the classes and the data hook stay in place. */
export interface LinkProps {
  href: string
  className?: string
  children: ReactNode
  'data-crumb': 'link'
}

interface RenderProps {
  /** Between crumbs, hidden from assistive technology. Default "/". */
  separator?: ReactNode
  /** Replaces the plain <a> for ancestor crumbs, for example with your router's Link. */
  renderLink?: (props: LinkProps) => ReactNode
  /** Classes added to the defaults, per part. */
  classNames?: Partial<ClassNames>
  /** Drop the default classes and use only `classNames`. */
  unstyled?: boolean
  /** The accessible name of the <nav>. Default "Breadcrumb". Translate it for non-English sites. */
  'aria-label'?: string
  /** Render a one-crumb trail (the site root). Default false: a trail of one item tells crawlers nothing. */
  renderOnRoot?: boolean
}

/** JSON-LD is on by default and needs the site's public origin; opting out must be explicit. */
type JsonLdProps =
  { baseUrl: string; jsonLd?: true } | { baseUrl?: string; jsonLd: false }

export type BreadcrumbsProps<T extends readonly RouteDef[] = never> =
  BuildOptions<T> & RenderProps & JsonLdProps

const orUndefined = (classes: string) => classes || undefined

/**
 * The breadcrumb trail for `path`, with its BreadcrumbList JSON-LD. Server-safe: no hooks, no effects, no browser
 * APIs, so it renders in React Server Components and with renderToString. Markup: a <nav> landmark with an
 * accessible name, an ordered list, real links for ancestors (keyboard-focusable in trail order), the current page
 * as text with aria-current="page", and separators hidden from assistive technology.
 */
export function Breadcrumbs<T extends readonly RouteDef[] = never>(
  props: BreadcrumbsProps<T>,
) {
  const {
    baseUrl,
    jsonLd = true,
    separator = '/',
    renderLink,
    classNames,
    unstyled,
    'aria-label': ariaLabel = 'Breadcrumb',
    renderOnRoot = false,
    ...buildOptions
  } = props
  const crumbs = buildBreadcrumbs(buildOptions as BuildOptions<T>)
  // Validated before the root check, so a missing baseUrl fails on every page, not only deep ones.
  const structured = jsonLd
    ? toJsonLd({ crumbs, baseUrl: baseUrl as string })
    : undefined
  if (crumbs.length < 2 && !renderOnRoot) return null
  const cls = resolveClassNames({ classNames, unstyled })

  return (
    <>
      <nav
        aria-label={ariaLabel}
        className={orUndefined(cls.nav)}
        data-crumb="nav"
      >
        <ol className={orUndefined(cls.list)} data-crumb="list">
          {crumbs.map((crumb, i) => (
            <li key={i} className={orUndefined(cls.item)} data-crumb="item">
              {crumb.current ? (
                <span
                  className={orUndefined(cls.current)}
                  data-crumb="current"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <>
                  {renderLink ? (
                    renderLink({
                      href: crumb.href,
                      className: orUndefined(cls.link),
                      children: crumb.label,
                      'data-crumb': 'link',
                    })
                  ) : (
                    <a
                      href={crumb.href}
                      className={orUndefined(cls.link)}
                      data-crumb="link"
                    >
                      {crumb.label}
                    </a>
                  )}
                  <span
                    aria-hidden="true"
                    className={orUndefined(cls.separator)}
                    data-crumb="separator"
                  >
                    {separator}
                  </span>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {structured && <JsonLdScript jsonLd={structured} />}
    </>
  )
}
