export const products = [
  { id: 'wooden-train', name: 'Wooden train set', price: 34 },
  { id: 'rainbow-stacker', name: 'Rainbow stacker', price: 18 },
  { id: 'puppet-theatre', name: 'Puppet theatre', price: 59 },
]

export const orders = [
  { id: '1001', placed: '2026-08-02', items: ['wooden-train'] },
  { id: '1002', placed: '2026-09-14', items: ['rainbow-stacker', 'puppet-theatre'] },
]

export const getProduct = id => products.find(product => product.id === id)
export const getOrder = id => orders.find(order => order.id === id)
