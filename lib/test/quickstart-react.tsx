import { Breadcrumbs } from 'breadcrumb-nav'

export function App({ pathname }: { pathname: string }) {
  return (
    <Breadcrumbs
      path={pathname}
      baseUrl="https://example.com"
      pathLabels={{ '/forms/42': 'Expense claim' }}
    />
  )
}
