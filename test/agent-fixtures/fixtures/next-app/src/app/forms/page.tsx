import Link from 'next/link'
import { forms } from '@/lib/forms'

export const metadata = { title: 'Forms' }

export default function FormsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Forms</h1>
      <ul className="mt-4 list-disc pl-6">
        {forms.map(form => (
          <li key={form.id}>
            <Link href={`/forms/${form.id}`} className="underline">
              {form.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
