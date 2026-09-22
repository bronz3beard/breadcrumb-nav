import type { Metadata } from 'next'
import { SiteBreadcrumbs } from '@/components/SiteBreadcrumbs'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://acme-forms.example'),
  title: { default: 'Acme Forms', template: '%s · Acme Forms' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="mx-auto max-w-3xl p-6">
        <header className="mb-6 border-b border-neutral-200 pb-4">
          <a href="/" className="text-lg font-semibold">
            Acme Forms
          </a>
        </header>
        <SiteBreadcrumbs />
        <main>{children}</main>
      </body>
    </html>
  )
}
