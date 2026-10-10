import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-styles'
import { t } from '@/i18n/bn'
import { formatNumber } from '@/lib/format'

type Props = { page: number; totalPages: number; params: Record<string, string | undefined> }

export default function Pagination({ page, totalPages, params }: Props) {
  if (totalPages <= 1) return null
  const href = (p: number) => {
    const qs = new URLSearchParams(
      Object.entries({ ...params, page: p > 1 ? String(p) : undefined }).filter(
        (e): e is [string, string] => Boolean(e[1]),
      ),
    ).toString()
    return `/products${qs ? `?${qs}` : ''}`
  }
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className={buttonClass('secondary')}>
          {t.list.prev}
        </Link>
      )}
      <span className="text-stone-600">
        {formatNumber(page)} / {formatNumber(totalPages)}
      </span>
      {page < totalPages && (
        <Link href={href(page + 1)} className={buttonClass('secondary')}>
          {t.list.next}
        </Link>
      )}
    </nav>
  )
}
