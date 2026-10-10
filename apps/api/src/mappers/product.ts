import type { ProductDto, PublicProduct, PublicProductCard, PublicVariant } from '@123/shared'
import type { ProductDoc } from '../db/types'

export const toProductDto = (doc: ProductDoc): ProductDto => ({
  id: doc._id.toHexString(),
  slug: doc.slug,
  sourceSlug: doc.sourceSlug,
  externalId: doc.externalId,
  title: doc.title,
  description: doc.description,
  images: doc.images,
  videos: doc.videos ?? [],
  price: doc.price,
  compareAtPrice: doc.compareAtPrice,
  costPrice: doc.costPrice,
  stock: doc.stock,
  brandSlug: doc.brandSlug,
  categorySlugs: doc.categorySlugs,
  options: doc.options,
  variants: doc.variants ?? [],
  attributes: doc.attributes,
  tags: doc.tags,
  fulfillment: doc.fulfillment,
  deliveryDays: doc.deliveryDays,
  visible: doc.visible,
  featured: doc.featured,
  meta: doc.meta,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
})

const hasStock = (stock: number | null | undefined) =>
  stock === undefined || stock === null || stock > 0

/** With variants, the product is in stock while any variant is. */
const isInStock = (doc: Pick<ProductDoc, 'stock' | 'variants'>) =>
  doc.variants?.length ? doc.variants.some((v) => hasStock(v.stock)) : hasStock(doc.stock)

const realCompareAt = (price: number, compareAtPrice: number | undefined) =>
  compareAtPrice && compareAtPrice > price ? compareAtPrice : null

const toPublicVariants = (doc: ProductDoc): PublicVariant[] =>
  (doc.variants ?? []).map((v) => {
    const price = v.price ?? doc.price
    return {
      sku: v.sku,
      options: v.options,
      price,
      compareAtPrice: realCompareAt(price, v.compareAtPrice ?? doc.compareAtPrice),
      inStock: hasStock(v.stock),
      image: v.image ?? null,
    }
  })

export const toPublicCard = (doc: ProductDoc): PublicProductCard => ({
  id: doc._id.toHexString(),
  slug: doc.slug,
  title: doc.title,
  images: doc.images.slice(0, 1),
  price: doc.price,
  compareAtPrice: realCompareAt(doc.price, doc.compareAtPrice),
  inStock: isInStock(doc),
})

export const toPublicProduct = (doc: ProductDoc): PublicProduct => ({
  id: doc._id.toHexString(),
  slug: doc.slug,
  title: doc.title,
  description: doc.description ?? null,
  images: doc.images,
  videos: doc.videos ?? [],
  price: doc.price,
  compareAtPrice: realCompareAt(doc.price, doc.compareAtPrice),
  inStock: isInStock(doc),
  brandSlug: doc.brandSlug,
  categorySlugs: doc.categorySlugs,
  options: doc.options,
  variants: toPublicVariants(doc),
  attributes: doc.attributes,
  deliveryDays: doc.deliveryDays ?? null,
  updatedAt: doc.updatedAt.toISOString(),
})

/** Only the fields cards need, to keep list queries light. */
export const cardProjection = {
  slug: 1,
  title: 1,
  images: { $slice: 1 },
  price: 1,
  compareAtPrice: 1,
  stock: 1,
  'variants.stock': 1,
} as const
