import {
  Breadcrumbs,
  buildBreadcrumbs,
  renderBreadcrumbsHtml,
  serializeJsonLd,
  toJsonLd,
  type Label,
} from 'breadcrumb-nav'
import {
  defineBreadcrumbNav,
  type BreadcrumbNavElement,
} from 'breadcrumb-nav/element'
import { useEffect, useRef, useState } from 'react'
import { BASE_URL, defaultPathLabels, pages, routes, snippets } from './site'
import stylesCssUrl from '../../lib/styles.css?url'

defineBreadcrumbNav()

type Tab = 'react' | 'element' | 'html' | 'next'
type Look = 'tailwind' | 'plain' | 'custom'

const customClasses = {
  nav: 'rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900',
  link: 'text-blue-700 dark:text-blue-300',
  separator: 'text-neutral-400',
}

/** The playground keeps its own pathname in the URL hash, so GitHub Pages can serve it without rewrites. */
const usePathname = () => {
  const read = () => location.hash.slice(1) || '/'
  const [pathname, setPathname] = useState(read)
  useEffect(() => {
    const onChange = () => setPathname(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return [pathname, (path: string) => (location.hash = path)] as const
}

export function App() {
  const [pathname, go] = usePathname()
  const [tab, setTab] = useState<Tab>('react')
  const [look, setLook] = useState<Look>('tailwind')
  const [pathLabels, setPathLabels] =
    useState<Record<`/${string}`, Label>>(defaultPathLabels)
  const [labelPath, setLabelPath] = useState('/forms/42')
  const [labelText, setLabelText] = useState('Expense claim')

  const options = { path: pathname, routes, pathLabels }
  const crumbs = buildBreadcrumbs(options)
  const jsonLd = serializeJsonLd(toJsonLd({ crumbs, baseUrl: BASE_URL }))
  const html = renderBreadcrumbsHtml({
    crumbs,
    baseUrl: BASE_URL,
    unstyled: look !== 'tailwind',
    classNames: look === 'custom' ? customClasses : undefined,
  })

  // The plain stylesheet is loaded only while it is selected, so the two looks never stack.
  useEffect(() => {
    if (look !== 'plain') return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = stylesCssUrl
    document.head.append(link)
    return () => link.remove()
  }, [look])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 font-sans">
      <h1 className="text-2xl font-bold">breadcrumb-nav playground</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Click through a fake site. The trail, its structured data and the HTML
        string update together, because they come from the same crumbs.{' '}
        <a
          className="underline"
          href="https://github.com/bronz3beard/breadcrumb-nav"
        >
          Source and docs
        </a>
        .
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Where you are
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {pages.map(page => (
            <button
              key={page.path}
              type="button"
              onClick={() => go(page.path)}
              title={page.note}
              aria-pressed={page.path === pathname}
              className="rounded border border-neutral-300 px-2 py-1 font-mono text-xs aria-pressed:bg-neutral-900 aria-pressed:text-white dark:border-neutral-700 dark:aria-pressed:bg-white dark:aria-pressed:text-black"
            >
              {decodeURIComponent(page.path)}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-sm">
          Or type a path
          <input
            className="ml-2 w-80 rounded border border-neutral-300 px-2 py-1 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
            value={pathname}
            onChange={event => go(event.target.value || '/')}
          />
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          {pages.find(page => page.path === pathname)?.note ??
            'labels inferred from the URL'}
        </p>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            The trail
          </h2>
          <div role="group" aria-label="Look" className="flex gap-1 text-xs">
            {(['tailwind', 'plain', 'custom'] as Look[]).map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={look === option}
                onClick={() => setLook(option)}
                className="rounded px-2 py-1 aria-pressed:bg-neutral-200 dark:aria-pressed:bg-neutral-800"
              >
                {option === 'tailwind'
                  ? 'Tailwind defaults'
                  : option === 'plain'
                    ? 'styles.css'
                    : 'custom classNames'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-1 border-b border-neutral-200 text-sm dark:border-neutral-800">
          {(
            [
              ['react', 'React'],
              ['element', 'Custom element'],
              ['html', 'HTML string'],
              ['next', 'Next.js'],
            ] as [Tab, string][]
          ).map(([id, name]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className="-mb-px border-b-2 border-transparent px-3 py-2 aria-selected:border-current aria-selected:font-medium"
            >
              {name}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          className="mt-4 min-h-16 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700"
        >
          {tab === 'react' && (
            <Breadcrumbs
              {...options}
              baseUrl={BASE_URL}
              unstyled={look !== 'tailwind'}
              classNames={look === 'custom' ? customClasses : undefined}
            />
          )}
          {tab === 'element' && (
            <ElementDemo
              pathname={pathname}
              pathLabels={pathLabels}
              look={look}
            />
          )}
          {tab === 'html' && (
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
              {html || '(nothing: a one-crumb trail renders nothing)'}
            </pre>
          )}
          {tab === 'next' && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              The Next.js entry is the React component with the path read from{' '}
              <code>usePathname()</code> and links rendered by{' '}
              <code>next/link</code>. It renders exactly what the React tab
              shows; this playground is a Vite app, so it is shown as code
              below.
            </p>
          )}
        </div>

        {crumbs.length < 2 && tab !== 'html' && (
          <p className="mt-2 text-xs text-neutral-500">
            Nothing rendered: a one-crumb trail tells crawlers nothing.
          </p>
        )}

        <pre className="mt-4 overflow-x-auto rounded-lg bg-neutral-900 p-4 font-mono text-xs text-neutral-100">
          {snippets[tab]}
        </pre>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-4 font-mono text-xs text-neutral-100">
          {look === 'tailwind'
            ? snippets.tailwind
            : look === 'plain'
              ? snippets.plain
              : `<Breadcrumbs classNames={${JSON.stringify(customClasses, null, 2)}} … />`}
        </pre>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Name a page
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            <code>pathLabels</code>, keyed by concrete path. Try{' '}
            <code>/forms/42</code>.
          </p>
          <form
            className="mt-2 flex flex-wrap gap-2 text-xs"
            onSubmit={event => {
              event.preventDefault()
              if (!labelPath.startsWith('/')) return
              setPathLabels({
                ...pathLabels,
                [labelPath as `/${string}`]: labelText,
              })
            }}
          >
            <input
              aria-label="Path"
              className="w-40 rounded border border-neutral-300 px-2 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900"
              value={labelPath}
              onChange={event => setLabelPath(event.target.value)}
            />
            <input
              aria-label="Label"
              className="w-40 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              value={labelText}
              onChange={event => setLabelText(event.target.value)}
            />
            <button
              type="submit"
              className="rounded bg-neutral-900 px-3 py-1 text-white dark:bg-white dark:text-black"
            >
              Set label
            </button>
          </form>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 font-mono text-xs text-neutral-100">
            {JSON.stringify(pathLabels, null, 2)}
          </pre>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            The declared routes
          </h2>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 font-mono text-xs text-neutral-100">
            {snippets.routes}
          </pre>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            What search engines read
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            The BreadcrumbList JSON-LD emitted after the trail. Positions count
            from 1, names match the labels, addresses are absolute, and the
            current page has none.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 font-mono text-xs text-neutral-100">
            {JSON.stringify(JSON.parse(jsonLd), null, 2)}
          </pre>
        </div>
      </section>
    </main>
  )
}

function ElementDemo({
  pathname,
  pathLabels,
  look,
}: {
  pathname: string
  pathLabels: Record<`/${string}`, Label>
  look: Look
}) {
  const ref = useRef<BreadcrumbNavElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.routes = routes
    el.pathLabels = pathLabels
    el.classNames = look === 'custom' ? customClasses : undefined
  }, [pathLabels, look])
  return (
    <breadcrumb-nav
      ref={ref}
      path={pathname}
      base-url={BASE_URL}
      unstyled={look !== 'tailwind' ? '' : undefined}
    />
  )
}
