export interface Form {
  id: string
  name: string
  description: string
}

export const forms: Form[] = [
  { id: '42', name: 'Expense claim', description: 'Claim back money you spent on company business.' },
  { id: '7', name: 'Leave request', description: 'Ask for annual, sick or unpaid leave.' },
  { id: '19', name: 'Equipment order', description: 'Order a laptop, monitor or phone.' },
]

export function getForm(id: string): Form | undefined {
  return forms.find(form => form.id === id)
}
