import { describe, expect, it } from 'vitest'
import { formatSegmentLabel } from './label.js'

describe('formatSegmentLabel', () => {
  it.each([
    ['kebab-case', 'expense-claims', 'Expense Claims'],
    ['snake_case', 'annual_report', 'Annual Report'],
    ['camelCase', 'userSettings', 'User Settings'],
    ['plus as space', 'risk+register', 'Risk Register'],
    ['already readable', 'About', 'About'],
    ['single word', 'forms', 'Forms'],
    ['numeric id unchanged', '42', '42'],
    [
      'uuid unchanged',
      '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
      '3f2504e0 4f89 11d3 9a0c 0305e82c3301',
    ],
    ['dots kept', 'v1.2', 'V1.2'],
    ['decoded unicode', 'café', 'Café'],
    ['mixed separators', 'my--odd__slug', 'My Odd Slug'],
  ])('%s: %s → %s', (_, segment, expected) => {
    expect(formatSegmentLabel(segment)).toBe(expected)
  })

  it('returns an empty string for an empty segment', () => {
    expect(formatSegmentLabel('')).toBe('')
  })
})
