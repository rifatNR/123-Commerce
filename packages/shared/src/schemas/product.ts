import { z } from 'zod'
import { FULFILLMENT_TYPES, IMPORT_BATCH_MAX } from '../constants'
import { localizedTextSchema, slugSchema, type LocalizedText } from './common'

export const catalogRefSchema = z.object({ slug: slugSchema, name: localizedTextSchema })
export type CatalogRef = z.infer<typeof catalogRefSchema>

export const productImageSchema = z.object({ url: z.url(), alt: z.string().max(300).optional() })

/** A choice the customer must make, e.g. { name: 'সাইজ', values: ['M', 'L', 'XL'] }. */
export const productOptionSchema = z.object({
  name: z.string().min(1).max(60),
  values: z.array(z.string().min(1).max(60)).min(1).max(50),
})

/**
 * The single fixed format every product is stored in, regardless of where it came from.
 * Import scripts transform their source data into this shape.
 * Anything that doesn't fit goes into `attributes` (shown to customers) or `meta` (internal).
 */
export const productInputSchema = z.object({
  /** The product's id in its source system. Unique per source. */
  externalId: z.string().min(1).max(200),
  /** Optional; generated from the English title (or ids) on first import and never changed after. */
  slug: slugSchema.optional(),
  title: localizedTextSchema,
  description: localizedTextSchema.optional(),
  images: z.array(productImageSchema).min(1).max(20),
  /** Selling price in BDT. */
  price: z.number().nonnegative(),
  /** Original price, shown crossed out. */
  compareAtPrice: z.number().nonnegative().optional(),
  /** What we pay the supplier. Never sent to customers. */
  costPrice: z.number().nonnegative().optional(),
  /** null = unknown / supplier managed. */
  stock: z.number().int().min(0).nullable().optional(),
  brand: catalogRefSchema.optional(),
  categories: z.array(catalogRefSchema).max(10).default([]),
  options: z.array(productOptionSchema).max(5).default([]),
  attributes: z
    .array(z.object({ name: z.string().min(1).max(100), value: z.string().min(1).max(1000) }))
    .max(50)
    .default([]),
  tags: z.array(z.string().max(60)).max(30).default([]),
  fulfillment: z.enum(FULFILLMENT_TYPES).default('dropship'),
  deliveryDays: z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }).optional(),
  /** Omit to keep the admin's choice on re-import (new products default to visible). */
  visible: z.boolean().optional(),
  /** Omit to keep the admin's choice on re-import (new products default to not featured). */
  featured: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type ProductInput = z.infer<typeof productInputSchema>

export const productImportSchema = z.object({
  sourceSlug: slugSchema,
  items: z
    .array(
      z.object({
        product: productInputSchema,
        /** The untouched source record, stored in the source's own collection. */
        raw: z.record(z.string(), z.unknown()).optional(),
        /** Optional change-detection hash. Defaults to sha1(JSON.stringify(raw ?? product)). */
        hash: z.string().max(200).optional(),
      }),
    )
    .min(1)
    .max(IMPORT_BATCH_MAX),
})

export const productPatchSchema = productInputSchema
  .omit({ externalId: true })
  .partial()
  .extend({ slug: slugSchema.optional() })
export type ProductPatch = z.infer<typeof productPatchSchema>

/** Admin / script view of a product. */
export type ProductDto = Omit<ProductInput, 'brand' | 'categories' | 'visible' | 'featured'> & {
  visible: boolean
  featured: boolean
  id: string
  slug: string
  sourceSlug: string
  brandSlug: string | null
  categorySlugs: string[]
  createdAt: string
  updatedAt: string
}

/** What customers see. No cost price, no internal meta. */
export type PublicProduct = {
  id: string
  slug: string
  title: LocalizedText
  description: LocalizedText | null
  images: { url: string; alt?: string }[]
  price: number
  compareAtPrice: number | null
  inStock: boolean
  brandSlug: string | null
  categorySlugs: string[]
  options: { name: string; values: string[] }[]
  attributes: { name: string; value: string }[]
  deliveryDays: { min: number; max: number } | null
  updatedAt: string
}

export type PublicProductCard = Pick<
  PublicProduct,
  'id' | 'slug' | 'title' | 'images' | 'price' | 'compareAtPrice' | 'inStock'
>
