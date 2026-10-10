import type { ReactNode } from 'react'

type Props = { label: string; error?: string; children: ReactNode }

export default function FormField({ label, error, children }: Props) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-semibold">{label}</span>
      {children}
      {error && (
        <span className="text-sm font-medium text-brand-700" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
