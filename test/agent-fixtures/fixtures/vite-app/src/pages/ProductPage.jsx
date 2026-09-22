import { useParams } from 'react-router'
import { getProduct } from '../data/products.js'

export function ProductPage() {
  const { productId } = useParams()
  const product = getProduct(productId)
  if (!product) return <h1>Not found</h1>
  return (
    <>
      <h1>{product.name}</h1>
      <p>£{product.price}</p>
    </>
  )
}
