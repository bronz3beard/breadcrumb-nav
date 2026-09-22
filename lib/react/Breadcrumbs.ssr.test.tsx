// Runs in Node (no jsdom): proves the component is server-safe and that the server HTML carries valid JSON-LD.
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Breadcrumbs } from './Breadcrumbs.js'
import {
  FIXTURE_BASE_URL,
  FIXTURE_JSON_LD,
  FIXTURE_NAV_HTML,
  FIXTURE_SCRIPT_HTML,
  jsonLdIn,
} from '../test/fixture.js'

describe('Breadcrumbs with renderToString', () => {
  const html = renderToString(
    <Breadcrumbs
      path="/forms/42"
      pathLabels={{ '/forms/42': 'Expense claim' }}
      baseUrl={FIXTURE_BASE_URL}
    />,
  )

  it('renders exactly the shared markup fixture and the JSON-LD script', () => {
    expect(html).toBe(FIXTURE_NAV_HTML + FIXTURE_SCRIPT_HTML)
  })

  it('puts parseable JSON-LD in the server HTML whose names equal the visible labels', () => {
    expect(jsonLdIn(html)).toEqual(FIXTURE_JSON_LD)
  })

  it('escapes a hostile label in the markup and keeps it intact in the JSON-LD', () => {
    const hostile = renderToString(
      <Breadcrumbs
        path="/x/y"
        pathLabels={{ '/x': '</script><b>&' }}
        baseUrl={FIXTURE_BASE_URL}
      />,
    )
    expect(hostile).toContain('&lt;/script&gt;&lt;b&gt;&amp;</a>')
    expect(hostile.split('</script>')).toHaveLength(2)
    expect(jsonLdIn(hostile)?.itemListElement[1].name).toBe('</script><b>&')
  })

  it('renders nothing for the site root', () => {
    expect(
      renderToString(<Breadcrumbs path="/" baseUrl={FIXTURE_BASE_URL} />),
    ).toBe('')
  })
})
