import { notFound } from 'next/navigation'
import { getForm } from '@/lib/forms'

export default async function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = getForm(id)
  if (!form) notFound()
  return (
    <>
      <h1 className="text-2xl font-bold">{form.name}</h1>
      <p className="mt-2 text-neutral-600">{form.description}</p>
    </>
  )
}
