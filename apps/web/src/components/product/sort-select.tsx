'use client'

import { PRODUCT_SORTS, type ProductSort } from '@123/shared'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { t } from '@/i18n/bn'

export default function SortSelect({ value }: { value: ProductSort }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <label className="flex items-center gap-2">
      <span className="text-stone-600">{t.list.sort}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-stone-300 bg-white px-3"
      >
        {PRODUCT_SORTS.map((s) => (
          <option key={s} value={s}>
            {t.list.sorts[s]}
          </option>
        ))}
      </select>
    </label>
  )
}
