import type { PublicProductCard } from '@123/shared'
import ProductCard from './product-card'

type Props = { products: PublicProductCard[]; priorityCount?: number }

export default function ProductGrid({ products, priorityCount = 0 }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
