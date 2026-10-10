'use client'

import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-styles'
import { CheckIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'
import { formatNumber, formatPrice, text } from '@/lib/format'
import { useHydrated } from '@/lib/use-hydrated'
import { useOrderStore } from '@/stores/order-store'
import OrderSummary from './order-summary'

export default function OrderConfirmation() {
  const hydrated = useHydrated()
  const order = useOrderStore((s) => s.lastOrder)

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-stone-200/60" />
  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 text-center ring-1 ring-stone-200">
        <p>{t.confirmation.missing}</p>
        <Link href="/" className={buttonClass()}>
          {t.confirmation.backHome}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center ring-1 ring-stone-200">
        <span className="grid size-16 place-items-center rounded-full bg-green-100 text-green-700">
          <CheckIcon className="size-9" />
        </span>
        <h1 className="text-2xl font-bold">{t.confirmation.title}</h1>
        <p className="text-lg">
          {t.confirmation.orderNo}: <strong className="text-brand-700">#{order.orderNumber}</strong>
        </p>
        <p className="rounded-xl bg-amber-50 p-3 text-amber-900">{t.confirmation.next}</p>
      </div>
      <ul className="flex flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span>
              {text(item.title)} × {formatNumber(item.quantity)}
            </span>
            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <OrderSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} />
      <Link href="/" className={buttonClass('secondary', 'lg')}>
        {t.confirmation.backHome}
      </Link>
    </div>
  )
}
