'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Hand-rolled breadcrumbs from 2023. Known problems: ids show as ids, the JSON-LD uses relative URLs (which search
// engines ignore), the current page is a link to itself, and the separators are read out by screen readers.
export function SiteBreadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = [
    { href: '/', name: 'Home' },
    ...parts.map((part, i) => ({
      href: '/' + parts.slice(0, i + 1).join('/'),
      name: part.charAt(0).toUpperCase() + part.slice(1),
    })),
  ]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.href,
    })),
  }
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-neutral-500">
        <ul className="flex gap-2">
          {crumbs.map(crumb => (
            <li key={crumb.href}>
              <Link href={crumb.href}>{crumb.name}</Link> /
            </li>
          ))}
        </ul>
      </nav>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </>
  )
}
