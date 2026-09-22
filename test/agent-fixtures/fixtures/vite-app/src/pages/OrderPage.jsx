import { useParams } from 'react-router'
import { getOrder, getProduct } from '../data/products.js'

export function OrderPage() {
  const { orderId } = useParams()
  const order = getOrder(orderId)
  if (!order) return <h1>Not found</h1>
  return (
    <>
      <h1>Order #{order.id}</h1>
      <p>Placed {order.placed}</p>
      <ul>
        {order.items.map(id => (
          <li key={id}>{getProduct(id).name}</li>
        ))}
      </ul>
    </>
  )
}
