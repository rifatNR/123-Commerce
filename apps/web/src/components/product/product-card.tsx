import type { PublicProductCard } from '@123/shared'
import Image from 'next/image'
import Link from 'next/link'
import Price from '@/components/ui/price'
import { t } from '@/i18n/bn'
import { discountPercent, formatNumber, text } from '@/lib/format'

type Props = { product: PublicProductCard; priority?: boolean }

export default function ProductCard({ product, priority = false }: Props) {
  const image = product.images[0]
  const pct = discountPercent(product.price, product.compareAtPrice)
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-stone-100">
        {image && (
          <Image
            src={image.url}
            alt={image.alt ?? text(product.title)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            priority={priority}
          />
        )}
        {pct > 0 && (
          <span className="absolute top-2 left-2 rounded-lg bg-brand-600 px-2 py-0.5 text-sm font-bold text-white">
            -{formatNumber(pct)}%
          </span>
        )}
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-stone-900/70 py-1 text-center text-sm text-white">
            {t.product.outOfStock}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 leading-snug font-medium text-stone-800 group-hover:text-brand-700">
          {text(product.title)}
        </h3>
        <div className="mt-auto">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </div>
    </Link>
  )
}
