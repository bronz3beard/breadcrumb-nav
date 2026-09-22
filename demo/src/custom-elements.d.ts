import type { BreadcrumbNavElement } from 'breadcrumb-nav/element'
import type { HTMLAttributes, RefAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'breadcrumb-nav': HTMLAttributes<HTMLElement> &
        RefAttributes<BreadcrumbNavElement> & {
          path?: string
          'base-url'?: string
          'nav-label'?: string
          separator?: string
          unstyled?: ''
          'render-on-root'?: ''
        }
    }
  }
}
