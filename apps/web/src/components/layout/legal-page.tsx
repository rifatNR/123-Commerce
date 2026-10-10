import type { ReactNode } from 'react'

type Props = { title: string; updated: string; children: ReactNode }

/** Shared layout for policy pages. */
export default function LegalPage({ title, updated, children }: Props) {
  return (
    <article className="mx-auto max-w-3xl rounded-2xl bg-white p-5 ring-1 ring-stone-200 sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-stone-500">সর্বশেষ হালনাগাদ: {updated}</p>
      <div className="mt-6 flex flex-col gap-4 leading-relaxed text-stone-700 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-stone-900 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </article>
  )
}
