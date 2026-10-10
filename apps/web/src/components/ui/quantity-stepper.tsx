'use client'

import { formatNumber } from '@/lib/format'

type Props = { value: number; onChange: (value: number) => void; max?: number; label: string }

export default function QuantityStepper({ value, onChange, max = 20, label }: Props) {
  const btn =
    'grid size-11 place-items-center text-xl font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40'
  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-xl bg-white ring-1 ring-stone-300"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="কমান"
      >
        −
      </button>
      <span className="min-w-10 text-center text-lg font-semibold" aria-live="polite">
        {formatNumber(value)}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="বাড়ান"
      >
        +
      </button>
    </div>
  )
}
