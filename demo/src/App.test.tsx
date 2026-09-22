// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App'

afterEach(() => {
  cleanup()
  location.hash = ''
})

const go = async (path: string) => {
  await act(async () => {
    location.hash = path
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('the playground', () => {
  it('renders the trail for a page, names the id, and shows matching JSON-LD', async () => {
    render(<App />)
    await go('/forms/42')
    const panel = screen.getByRole('tabpanel')
    const items = within(panel)
      .getAllByRole('listitem')
      .map(item => item.textContent)
    // /forms declares its parent, so the trail leaves the URL; /forms/42 is named by pathLabels.
    expect(items).toEqual([
      'Home/',
      'Settings/',
      'Forms admin/',
      'Forms/',
      'Expense claim',
    ])
    expect(screen.getByText(/"name": "Expense claim"/)).toBeTruthy()
  })

  it('renders nothing on the root and says so', async () => {
    render(<App />)
    await go('/')
    expect(
      within(screen.getByRole('tabpanel')).queryByRole('navigation'),
    ).toBeNull()
    expect(screen.getByText(/Nothing rendered/)).toBeTruthy()
  })

  it('shows the same trail through the custom element and as an HTML string', async () => {
    render(<App />)
    await go('/docs/guides/routing/nested/deep')
    await act(async () =>
      screen.getByRole('tab', { name: 'Custom element' }).click(),
    )
    const element = screen.getByRole('tabpanel').querySelector('breadcrumb-nav')
    expect(element?.querySelector('[aria-current="page"]')?.textContent).toBe(
      'Deep',
    )
    expect(element?.querySelectorAll('a')).toHaveLength(5)
    await act(async () =>
      screen.getByRole('tab', { name: 'HTML string' }).click(),
    )
    expect(screen.getByRole('tabpanel').textContent).toContain(
      'aria-current="page">Deep</span>',
    )
  })

  it('lets a label be set live', async () => {
    render(<App />)
    await go('/docs')
    const pathInput = screen.getByLabelText('Path') as HTMLInputElement
    const labelInput = screen.getByLabelText('Label') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(pathInput, '/docs')
      pathInput.dispatchEvent(new Event('input', { bubbles: true }))
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(labelInput, 'Docs, renamed')
      labelInput.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () =>
      screen.getByRole('button', { name: 'Set label' }).click(),
    )
    expect(
      within(screen.getByRole('tabpanel'))
        .getByText('Docs, renamed')
        .getAttribute('aria-current'),
    ).toBe('page')
  })
})
