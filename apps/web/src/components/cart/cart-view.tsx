'use client'

import type { DeliveryZone, StoreConfig } from '@123/shared'
import Link from 'next/link'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/button-styles'
import { CartIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'
import { useHydrated } from '@/lib/use-hydrated'
import { cartSubtotal, useCartStore } from '@/stores/cart-store'
import CartLine from './cart-line'
import CheckoutForm from './checkout-form'
import OrderSummary from './order-summary'

export default function CartView({ config }: { config: StoreConfig }) {
  const hydrated = useHydrated()
  const items = useCartStore((s) => s.items)
  const [zone, setZone] = useState<DeliveryZone>('inside_dhaka')

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-stone-200/60" />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 text-center ring-1 ring-stone-200">
        <CartIcon className="size-12 text-stone-300" />
        <p className="text-lg font-semibold">{t.cart.empty}</p>
        <Link href="/products" className={buttonClass('primary', 'lg')}>
          {t.cart.continue}
        </Link>
      </div>
    )
  }

  const subtotal = cartSubtotal(items)
  const deliveryFee = config.deliveryFees[zone]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <section className="flex flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <CartLine key={item.key} item={item} />
          ))}
        </ul>
        <OrderSummary subtotal={subtotal} deliveryFee={deliveryFee} />
      </section>
      <section>
        <CheckoutForm
          items={items}
          zone={zone}
          onZoneChange={setZone}
          fees={config.deliveryFees}
          total={subtotal + deliveryFee}
        />
      </section>
    </div>
  )
}
