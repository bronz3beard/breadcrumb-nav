import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Root } from './Root.jsx'
import { AccountPage } from './pages/AccountPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { OrderPage } from './pages/OrderPage.jsx'
import { OrdersPage } from './pages/OrdersPage.jsx'
import { ProductPage } from './pages/ProductPage.jsx'
import { ProductsPage } from './pages/ProductsPage.jsx'
import { ReturnsPage } from './pages/ReturnsPage.jsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: 'products', Component: ProductsPage },
      { path: 'products/:productId', Component: ProductPage },
      { path: 'account', Component: AccountPage },
      { path: 'account/orders', Component: OrdersPage },
      { path: 'account/orders/:orderId', Component: OrderPage },
      { path: 'returns', Component: ReturnsPage },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
