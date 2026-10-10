'use client'

import type { PublicProduct } from '@123/shared'
import Price from '@/components/ui/price'
import { selectedVariant } from '@/lib/variants'
import { useSelectedOptions } from '@/stores/product-selection-store'

/** The product page price. Follows the selected variant once one is picked. */
export default function ProductPrice({ product }: { product: PublicProduct }) {
  const variant = selectedVariant(product, useSelectedOptions(product.id))
  return (
    <Price
      price={variant?.price ?? product.price}
      compareAtPrice={variant ? variant.compareAtPrice : product.compareAtPrice}
      size="lg"
      showBadge
    />
  )
}
