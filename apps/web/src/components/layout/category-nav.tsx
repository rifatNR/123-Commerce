import type { CatalogItemDto } from '@123/shared'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { text } from '@/lib/format'
import { t } from '@/i18n/bn'

type Props = { categories: CatalogItemDto[]; active?: string; extraParams?: Record<string, string> }

/** Horizontally scrollable category chips. Links, so they work without JavaScript. */
export default function CategoryNav({ categories, active, extraParams = {} }: Props) {
  if (categories.length === 0) return null
  const href = (category?: string) => {
    const params = new URLSearchParams({ ...extraParams, ...(category ? { category } : {}) })
    const qs = params.toString()
    return `/products${qs ? `?${qs}` : ''}`
  }
  const chip = (isActive: boolean) =>
    cn(
      'shrink-0 rounded-full px-4 py-2 font-medium ring-1 transition-colors',
      isActive
        ? 'bg-brand-600 text-white ring-brand-600'
        : 'bg-white text-stone-700 ring-stone-200 hover:ring-brand-300',
    )

  return (
    <nav
      aria-label={t.nav.categories}
      className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4"
    >
      <ul className="flex gap-2 pb-1">
        <li>
          <Link href={href()} className={chip(!active)}>
            {t.list.allCategories}
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={href(c.slug)} className={chip(active === c.slug)}>
              {text(c.name)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
