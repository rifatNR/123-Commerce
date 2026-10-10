'use client'

import Link from 'next/link'
import { CartIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'
import { formatNumber } from '@/lib/format'
import { useHydrated } from '@/lib/use-hydrated'
import { cartCount, useCartStore } from '@/stores/cart-store'

export default function CartLink() {
  const hydrated = useHydrated()
  const count = useCartStore((s) => cartCount(s.items))
  return (
    <Link
      href="/cart"
      className="relative flex h-11 items-center gap-2 rounded-xl px-3 font-medium text-stone-800 hover:bg-stone-100"
    >
      <CartIcon className="size-6" />
      <span className="hidden sm:inline">{t.nav.cart}</span>
      {hydrated && count > 0 && (
        <span className="absolute -top-0.5 left-6 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
          {formatNumber(count)}
        </span>
      )}
    </Link>
  )
}
