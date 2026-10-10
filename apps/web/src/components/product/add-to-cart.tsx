'use client'

import type { PublicProduct } from '@123/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/button-styles'
import QuantityStepper from '@/components/ui/quantity-stepper'
import { t } from '@/i18n/bn'
import { cn } from '@/lib/cn'
import { trackPixel } from '@/lib/meta-pixel'
import { MAX_QTY, useCartStore } from '@/stores/cart-store'
import { toast } from '@/stores/toast-store'

type Props = { product: PublicProduct }

export default function AddToCart({ product }: Props) {
  const router = useRouter()
  const add = useCartStore((s) => s.add)
  const [quantity, setQuantity] = useState(1)
  const [options, setOptions] = useState<Record<string, string>>({})
  const [showErrors, setShowErrors] = useState(false)

  const missing = product.options.filter((o) => !options[o.name])

  const addToCart = () => {
    if (missing.length > 0) {
      setShowErrors(true)
      toast(t.product.selectOption(missing[0]!.name), 'error')
      return false
    }
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.images[0]?.url ?? null,
      price: product.price,
      quantity,
      options,
    })
    trackPixel('AddToCart', {
      content_ids: [product.id],
      content_type: 'product',
      value: product.price * quantity,
      currency: 'BDT',
    })
    return true
  }

  if (!product.inStock) {
    return (
      <p className="rounded-xl bg-stone-100 p-4 text-center font-semibold text-stone-600">
        {t.product.outOfStock}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {product.options.map((option) => (
        <fieldset key={option.name}>
          <legend
            className={cn(
              'mb-2 font-semibold',
              showErrors && !options[option.name] && 'text-brand-700',
            )}
          >
            {t.product.selectOption(option.name)}
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const selected = options[option.name] === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setOptions((o) => ({ ...o, [option.name]: value }))}
                  className={cn(
                    'min-h-11 min-w-12 rounded-xl px-4 font-medium ring-1',
                    selected
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white ring-stone-300 hover:ring-brand-400',
                  )}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-3">
        <span className="font-semibold">{t.product.quantity}</span>
        <QuantityStepper
          value={quantity}
          onChange={(q) => setQuantity(Math.min(MAX_QTY, Math.max(1, q)))}
          label={t.product.quantity}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className={buttonClass('primary', 'lg')}
          onClick={() => {
            if (addToCart()) router.push('/cart')
          }}
        >
          {t.product.orderNow}
        </button>
        <button
          type="button"
          className={buttonClass('secondary', 'lg')}
          onClick={() => {
            if (addToCart()) toast(t.product.added, 'success')
          }}
        >
          {t.product.addToCart}
        </button>
      </div>
    </div>
  )
}
