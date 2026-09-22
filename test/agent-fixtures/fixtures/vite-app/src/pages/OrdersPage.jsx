import { Link } from 'react-router'
import { orders } from '../data/products.js'

export function OrdersPage() {
  return (
    <>
      <h1>Orders</h1>
      <ul>
        {orders.map(order => (
          <li key={order.id}>
            <Link to={`/account/orders/${order.id}`}>Order #{order.id}</Link> placed {order.placed}
          </li>
        ))}
      </ul>
    </>
  )
}
