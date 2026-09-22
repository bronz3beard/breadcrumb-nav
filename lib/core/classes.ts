/** The styleable parts of the trail. Every renderer also marks each part with a `data-crumb` attribute of the same name. */
export interface ClassNames {
  nav: string
  list: string
  item: string
  link: string
  current: string
  separator: string
}

/**
 * Default Tailwind CSS 4 utilities. Whole string literals only: Tailwind finds classes by scanning source text, so
 * a class built by concatenation would never be generated. No colour utilities: the trail inherits the page's text
 * colour, which keeps it right in dark mode. The focus ring uses `currentColor` for the same reason.
 */
export const DEFAULT_CLASSES: ClassNames = {
  nav: 'text-sm',
  list: 'flex flex-wrap items-center gap-x-1.5 gap-y-1 m-0 p-0 list-none',
  item: 'flex items-center gap-x-1.5',
  link: 'opacity-70 hover:opacity-100 hover:underline underline-offset-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
  current: 'font-medium',
  separator: 'opacity-50 select-none',
}

/** Merges consumer classes onto the defaults, or replaces them entirely with `unstyled`. */
export function resolveClassNames(options: {
  classNames?: Partial<ClassNames>
  unstyled?: boolean
}): ClassNames {
  const resolved = {} as ClassNames
  for (const slot of Object.keys(DEFAULT_CLASSES) as (keyof ClassNames)[]) {
    resolved[slot] = [
      options.unstyled ? '' : DEFAULT_CLASSES[slot],
      options.classNames?.[slot] ?? '',
    ]
      .filter(Boolean)
      .join(' ')
  }
  return resolved
}
