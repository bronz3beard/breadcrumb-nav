import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'

// Breadcrumbs as a navigation history: every page you visit is appended, the list is kept in localStorage so it
// survives a refresh, and going home clears it. Known problems: a deep link shows only the current page, the trail
// depends on the order pages were visited, and ids show as ids.
export function Breadcrumbs() {
  const { pathname } = useLocation()
  const [trail, setTrail] = useState(() => JSON.parse(localStorage.getItem('trail') || '[]'))

  useEffect(() => {
    if (pathname === '/') {
      localStorage.removeItem('trail')
      setTrail([])
      return
    }
    const name = pathname.split('/').filter(Boolean).pop().replace(/-/g, ' ')
    const next = [...trail.filter(item => item.path !== pathname), { path: pathname, name }]
    localStorage.setItem('trail', JSON.stringify(next))
    setTrail(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (trail.length === 0) return null
  return (
    <div className="breadcrumbs">
      <Link to="/">Home</Link>
      {trail.map(item => (
        <span key={item.path}>
          {' > '}
          <Link to={item.path} style={{ textTransform: 'capitalize' }}>
            {item.name}
          </Link>
        </span>
      ))}
    </div>
  )
}
