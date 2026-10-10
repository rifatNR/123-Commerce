'use client'

import Image from 'next/image'
import Link from 'next/link'
import { TrashIcon } from '@/components/ui/icons'
import QuantityStepper from '@/components/ui/quantity-stepper'
import { t } from '@/i18n/bn'
import { formatPrice, text } from '@/lib/format'
import { useCartStore, type CartItem } from '@/stores/cart-store'

export default function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((s) => s.setQuantity)
  const remove = useCartStore((s) => s.remove)
  const options = Object.entries(item.options)

  return (
    <li className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-200">
      <Link
        href={`/products/${item.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-stone-100"
      >
        {item.image && (
          <Image
            src={item.image}
            alt={text(item.title)}
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${item.slug}`} className="line-clamp-2 font-medium">
            {text(item.title)}
          </Link>
          <button
            type="button"
            onClick={() => remove(item.key)}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-brand-700"
            aria-label={t.cart.remove}
          >
            <TrashIcon className="size-5" />
          </button>
        </div>
        {options.length > 0 && (
          <p className="text-sm text-stone-600">
            {options.map(([k, v]) => `${k}: ${v}`).join(', ')}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => setQuantity(item.key, q)}
            label={t.product.quantity}
          />
          <span className="text-lg font-bold text-brand-700">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </li>
  )
}
