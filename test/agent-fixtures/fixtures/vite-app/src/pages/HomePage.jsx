import { Link } from 'react-router'

export function HomePage() {
  return (
    <>
      <h1>Toys for small people</h1>
      <p>
        <Link to="/products">Shop all products</Link> · <Link to="/account">Your account</Link>
      </p>
    </>
  )
}
