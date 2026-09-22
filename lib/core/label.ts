const CAMEL_BOUNDARY = /([a-z0-9])([A-Z])/g
const WORD_BREAK = /[-_+\s]+/g

/**
 * Turns a decoded path segment into a readable label: "expense-claims" → "Expense Claims", "userSettings" →
 * "User Settings", "annual_report" → "Annual Report". Numbers and ids are left as they are. Dots are kept, because in
 * URLs they are usually versions or file names ("v1.2", "index.html"), not word breaks.
 */
export function formatSegmentLabel(segment: string): string {
  return segment
    .replace(CAMEL_BOUNDARY, '$1 $2')
    .split(WORD_BREAK)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}
