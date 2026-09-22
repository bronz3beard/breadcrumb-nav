// The built entry file plus every chunk it imports, transitively: what a consumer's bundler ships for that import.
// Shared by the size, purity and class gates so they all measure the same thing.
import { readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const RELATIVE_IMPORT = /(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g

/** @param {string} file @param {Set<string>} [seen] @returns {Set<string>} */
export const withImports = (file, seen = new Set()) => {
  if (seen.has(file)) return seen
  seen.add(file)
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(
    RELATIVE_IMPORT,
  )) {
    withImports(normalize(join(dirname(file), specifier)), seen)
  }
  return seen
}

/** The concatenated source of an entry's whole import graph. */
export const graphSource = file =>
  [...withImports(file)].map(path => readFileSync(path, 'utf8')).join('\n')
