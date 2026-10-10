import { cn } from '@/lib/cn'
import { discountPercent, formatNumber, formatPrice } from '@/lib/format'
import { t } from '@/i18n/bn'

type Props = {
  price: number
  compareAtPrice: number | null
  size?: 'sm' | 'lg'
  showBadge?: boolean
}

export default function Price({ price, compareAtPrice, size = 'sm', showBadge = false }: Props) {
  const pct = discountPercent(price, compareAtPrice)
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={cn('font-bold text-brand-700', size === 'lg' ? 'text-3xl' : 'text-lg')}>
        {formatPrice(price)}
      </span>
      {compareAtPrice && pct > 0 && (
        <span className={cn('text-stone-400 line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>
          {formatPrice(compareAtPrice)}
        </span>
      )}
      {showBadge && pct > 0 && (
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-sm font-semibold text-brand-700">
          {t.product.off(formatNumber(pct))}
        </span>
      )}
    </div>
  )
}
