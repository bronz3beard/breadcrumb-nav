import { Link, Outlet } from 'react-router'
import { Breadcrumbs } from './components/Breadcrumbs.jsx'

export function Root() {
  return (
    <>
      <header className="site-header">
        <Link to="/">Tots Store</Link>
      </header>
      <Breadcrumbs />
      <main>
        <Outlet />
      </main>
    </>
  )
}
