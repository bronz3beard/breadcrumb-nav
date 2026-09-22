// The README's React quick start is a real file: this proves the snippet people copy renders a trail with JSON-LD,
// and that the README shows that file word for word.
import { readFileSync } from 'node:fs'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from '../test/quickstart-react.js'
import { jsonLdIn } from '../test/fixture.js'

describe('README quick start', () => {
  it('appears in the README exactly as the fixture file', () => {
    const snippet = readFileSync('lib/test/quickstart-react.tsx', 'utf8').trim()
    expect(readFileSync('README.md', 'utf8')).toContain(snippet)
  })

  it('renders the trail and its structured data', () => {
    const html = renderToString(<App pathname="/forms/42" />)
    expect(html).toContain('<nav aria-label="Breadcrumb"')
    expect(html).toContain('aria-current="page">Expense claim</span>')
    expect(jsonLdIn(html)?.itemListElement.map(item => item.name)).toEqual([
      'Home',
      'Forms',
      'Expense claim',
    ])
  })
})
