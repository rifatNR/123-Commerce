import { t } from '@/i18n/bn'
import { formatPrice } from '@/lib/format'

type Props = { subtotal: number; deliveryFee: number }

export default function OrderSummary({ subtotal, deliveryFee }: Props) {
  return (
    <dl className="flex flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <div className="flex justify-between">
        <dt className="text-stone-600">{t.cart.subtotal}</dt>
        <dd className="font-medium">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-stone-600">{t.cart.delivery}</dt>
        <dd className="font-medium">{formatPrice(deliveryFee)}</dd>
      </div>
      <div className="flex justify-between border-t border-stone-200 pt-2 text-lg">
        <dt className="font-bold">{t.cart.total}</dt>
        <dd className="font-bold text-brand-700">{formatPrice(subtotal + deliveryFee)}</dd>
      </div>
    </dl>
  )
}
