'use client'

import type { PublicProduct } from '@123/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import OptionPicker from '@/components/product/option-picker'
import { buttonClass } from '@/components/ui/button-styles'
import QuantityStepper from '@/components/ui/quantity-stepper'
import { t } from '@/i18n/bn'
import { trackPixel } from '@/lib/meta-pixel'
import { choose, selectedVariant } from '@/lib/variants'
import { MAX_QTY, useCartStore } from '@/stores/cart-store'
import { useSelectedOptions, useSelectionStore } from '@/stores/product-selection-store'
import { toast } from '@/stores/toast-store'

type Props = { product: PublicProduct }

export default function AddToCart({ product }: Props) {
  const router = useRouter()
  const add = useCartStore((s) => s.add)
  const [quantity, setQuantity] = useState(1)
  const options = useSelectedOptions(product.id)
  const setOptions = useSelectionStore((s) => s.setOptions)
  const [showErrors, setShowErrors] = useState(false)

  const missing = product.options.filter((o) => !options[o.name])
  const variant = selectedVariant(product, options)
  const price = variant?.price ?? product.price

  const addToCart = () => {
    if (missing.length > 0) {
      setShowErrors(true)
      toast(t.product.selectOption(missing[0]!.name), 'error')
      return false
    }
    // Every option is picked, so with variants there must be a matching one in stock.
    if (product.variants.length > 0 && !variant?.inStock) {
      toast(t.product.variantSoldOut, 'error')
      return false
    }
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: variant?.image ?? product.images[0]?.url ?? null,
      price,
      quantity,
      options,
    })
    trackPixel('AddToCart', {
      content_ids: [product.id],
      content_type: 'product',
      value: price * quantity,
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
        <OptionPicker
          key={option.name}
          product={product}
          option={option}
          chosen={options}
          showError={showErrors && !options[option.name]}
          onChoose={(value) => setOptions(product.id, choose(product, options, option.name, value))}
        />
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
