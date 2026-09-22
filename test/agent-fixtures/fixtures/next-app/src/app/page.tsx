import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Welcome</h1>
      <p className="mt-2">
        <Link href="/forms" className="underline">
          Browse forms
        </Link>
      </p>
    </>
  )
}
