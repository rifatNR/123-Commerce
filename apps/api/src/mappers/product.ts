import type { ProductDto, PublicProduct, PublicProductCard } from '@123/shared'
import type { ProductDoc } from '../db/types'

export const toProductDto = (doc: ProductDoc): ProductDto => ({
  id: doc._id.toHexString(),
  slug: doc.slug,
  sourceSlug: doc.sourceSlug,
  externalId: doc.externalId,
  title: doc.title,
  description: doc.description,
  images: doc.images,
  price: doc.price,
  compareAtPrice: doc.compareAtPrice,
  costPrice: doc.costPrice,
  stock: doc.stock,
  brandSlug: doc.brandSlug,
  categorySlugs: doc.categorySlugs,
  options: doc.options,
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

const isInStock = (doc: Pick<ProductDoc, 'stock'>) =>
  doc.stock === undefined || doc.stock === null || doc.stock > 0

const realCompareAt = (doc: Pick<ProductDoc, 'price' | 'compareAtPrice'>) =>
  doc.compareAtPrice && doc.compareAtPrice > doc.price ? doc.compareAtPrice : null

export const toPublicCard = (doc: ProductDoc): PublicProductCard => ({
  id: doc._id.toHexString(),
  slug: doc.slug,
  title: doc.title,
  images: doc.images.slice(0, 1),
  price: doc.price,
  compareAtPrice: realCompareAt(doc),
  inStock: isInStock(doc),
})

export const toPublicProduct = (doc: ProductDoc): PublicProduct => ({
  id: doc._id.toHexString(),
  slug: doc.slug,
  title: doc.title,
  description: doc.description ?? null,
  images: doc.images,
  price: doc.price,
  compareAtPrice: realCompareAt(doc),
  inStock: isInStock(doc),
  brandSlug: doc.brandSlug,
  categorySlugs: doc.categorySlugs,
  options: doc.options,
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
} as const
