import { Link } from 'react-router'
import { products } from '../data/products.js'

export function ProductsPage() {
  return (
    <>
      <h1>Products</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <Link to={`/products/${product.id}`}>{product.name}</Link> — £{product.price}
          </li>
        ))}
      </ul>
    </>
  )
}
