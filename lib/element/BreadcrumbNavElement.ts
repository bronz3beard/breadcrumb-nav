import { buildBreadcrumbs } from '../core/build.js'
import { resolveClassNames, type ClassNames } from '../core/classes.js'
import { serializeJsonLd, toJsonLd } from '../core/jsonld.js'
import type { BuildOptions, Label, RouteDef } from '../core/types.js'

/**
 * <breadcrumb-nav>: the trail as a custom element, for Angular, Vue, Svelte, Astro islands and plain HTML. Renders
 * into light DOM (so the page's CSS and Tailwind apply) with the same markup as the React component, plus the
 * BreadcrumbList JSON-LD. Configure with attributes for strings and booleans, and with properties for objects.
 *
 * Attributes: path, base-url, json-ld ("false" to opt out), home ("false" to remove it), home-label, home-href,
 * base-path, separator, strict, unstyled, render-on-root, trailing-slash, nav-label.
 * Properties: routes, labels, pathLabels, formatLabel, classNames.
 *
 * Without a `path` attribute it reads location.pathname and re-renders on the Navigation API's `navigatesuccess`
 * event where the browser has it (which covers pushState), otherwise only on popstate (back and forward). Routers in
 * other browsers should set `path` or call refresh() after navigating.
 */
export class BreadcrumbNavElement extends HTMLElement {
  static observedAttributes = [
    'path',
    'base-url',
    'json-ld',
    'home',
    'home-label',
    'home-href',
    'base-path',
    'separator',
    'strict',
    'unstyled',
    'render-on-root',
    'trailing-slash',
    'nav-label',
  ]

  #routes?: readonly RouteDef[]
  #labels?: Record<string, Label>
  #pathLabels?: BuildOptions['pathLabels']
  #formatLabel?: BuildOptions['formatLabel']
  #classNames?: Partial<ClassNames>
  #onNavigate = () => this.refresh()

  get routes() {
    return this.#routes
  }
  set routes(value: readonly RouteDef[] | undefined) {
    this.#routes = value
    this.refresh()
  }

  get labels() {
    return this.#labels
  }
  set labels(value: Record<string, Label> | undefined) {
    this.#labels = value
    this.refresh()
  }

  get pathLabels() {
    return this.#pathLabels
  }
  set pathLabels(value: BuildOptions['pathLabels']) {
    this.#pathLabels = value
    this.refresh()
  }

  get formatLabel() {
    return this.#formatLabel
  }
  set formatLabel(value: BuildOptions['formatLabel']) {
    this.#formatLabel = value
    this.refresh()
  }

  get classNames() {
    return this.#classNames
  }
  set classNames(value: Partial<ClassNames> | undefined) {
    this.#classNames = value
    this.refresh()
  }

  connectedCallback() {
    this.refresh()
    const navigation = (window as { navigation?: EventTarget }).navigation
    if (navigation) {
      navigation.addEventListener('navigatesuccess', this.#onNavigate)
    } else {
      window.addEventListener('popstate', this.#onNavigate)
    }
  }

  disconnectedCallback() {
    const navigation = (window as { navigation?: EventTarget }).navigation
    navigation?.removeEventListener('navigatesuccess', this.#onNavigate)
    window.removeEventListener('popstate', this.#onNavigate)
  }

  attributeChangedCallback() {
    this.refresh()
  }

  /** Re-reads the attributes, properties and (without a `path` attribute) location.pathname, and re-renders. */
  refresh() {
    if (!this.isConnected) return
    this.replaceChildren(...this.#render())
  }

  #attr(name: string): string | undefined {
    return this.getAttribute(name) ?? undefined
  }

  #render(): Node[] {
    const homeLabel = this.#attr('home-label')
    const homeHref = this.#attr('home-href')
    const crumbs = buildBreadcrumbs({
      path: this.#attr('path') ?? location.pathname,
      routes: this.#routes,
      labels: this.#labels,
      pathLabels: this.#pathLabels,
      home:
        this.#attr('home') === 'false'
          ? false
          : homeLabel || homeHref
            ? { label: homeLabel, href: homeHref }
            : undefined,
      basePath: this.#attr('base-path'),
      strict: this.hasAttribute('strict'),
      formatLabel: this.#formatLabel,
      trailingSlash: this.#attr('trailing-slash') as
        BuildOptions['trailingSlash'] | undefined,
    } as BuildOptions<readonly RouteDef[]>)

    const jsonLd = this.#attr('json-ld') !== 'false'
    // Validated before the root check, so a missing base-url fails on every page, not only deep ones.
    const structured = jsonLd
      ? toJsonLd({ crumbs, baseUrl: this.#attr('base-url') as string })
      : undefined
    if (crumbs.length < 2 && !this.hasAttribute('render-on-root')) return []

    const cls = resolveClassNames({
      classNames: this.#classNames,
      unstyled: this.hasAttribute('unstyled'),
    })
    const separator = this.#attr('separator') ?? '/'
    const el = (
      tag: string,
      attributes: Record<string, string | undefined>,
      text?: string,
    ) => {
      const node = document.createElement(tag)
      for (const [name, value] of Object.entries(attributes)) {
        if (value) node.setAttribute(name, value)
      }
      if (text !== undefined) node.textContent = text
      return node
    }

    const list = el('ol', { class: cls.list, 'data-crumb': 'list' })
    for (const crumb of crumbs) {
      const item = el('li', { class: cls.item, 'data-crumb': 'item' })
      if (crumb.current) {
        item.append(
          el(
            'span',
            {
              class: cls.current,
              'data-crumb': 'current',
              'aria-current': 'page',
            },
            crumb.label,
          ),
        )
      } else {
        item.append(
          el(
            'a',
            { href: crumb.href, class: cls.link, 'data-crumb': 'link' },
            crumb.label,
          ),
          el(
            'span',
            {
              'aria-hidden': 'true',
              class: cls.separator,
              'data-crumb': 'separator',
            },
            separator,
          ),
        )
      }
      list.append(item)
    }
    const nav = el('nav', {
      'aria-label': this.#attr('nav-label') ?? 'Breadcrumb',
      class: cls.nav,
      'data-crumb': 'nav',
    })
    nav.append(list)

    if (!structured) return [nav]
    const script = el('script', { type: 'application/ld+json' })
    script.textContent = serializeJsonLd(structured)
    return [nav, script]
  }
}

/**
 * Registers the element, under <breadcrumb-nav> or a tag name of your choice. Safe to call more than once.
 */
export function defineBreadcrumbNav(tagName = 'breadcrumb-nav'): void {
  if (customElements.get(tagName)) return
  // A constructor can be registered once, so any other tag name gets a subclass.
  customElements.define(
    tagName,
    tagName === 'breadcrumb-nav'
      ? BreadcrumbNavElement
      : class extends BreadcrumbNavElement {},
  )
}
