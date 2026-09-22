import { Link } from 'react-router'

export function AccountPage() {
  return (
    <>
      <h1>Your account</h1>
      <p>
        <Link to="/account/orders">Orders</Link> · <Link to="/returns">Returns</Link>
      </p>
    </>
  )
}
