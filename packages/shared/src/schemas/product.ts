import { z } from 'zod'
import { FULFILLMENT_TYPES, IMPORT_BATCH_MAX } from '../constants'
import { localizedTextSchema, slugSchema, type LocalizedText } from './common'

export const catalogRefSchema = z.object({ slug: slugSchema, name: localizedTextSchema })
export type CatalogRef = z.infer<typeof catalogRefSchema>

export const productImageSchema = z.object({ url: z.url(), alt: z.string().max(300).optional() })

/** A product video (mp4/webm URL). Shown in the gallery after the images. */
export const productVideoSchema = z.object({
  url: z.url(),
  /** Still image shown before the video plays. */
  poster: z.url().optional(),
})

/** A choice the customer must make, e.g. { name: 'সাইজ', values: ['M', 'L', 'XL'] }. */
export const productOptionSchema = z.object({
  name: z.string().min(1).max(60),
  values: z.array(z.string().min(1).max(60)).min(1).max(50),
})

/**
 * One buyable combination of option values, e.g. { options: { রঙ: 'লাল', সাইজ: 'L' } }.
 * Price/stock fall back to the product's own when omitted.
 */
export const productVariantSchema = z.object({
  /** The variant's id/SKU in its source system. Unique within the product. */
  sku: z.string().min(1).max(200),
  /** Option name -> value. Must cover every product option. */
  options: z.record(z.string(), z.string()),
  price: z.number().nonnegative().optional(),
  compareAtPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  /** Shown in the gallery when this variant is selected. */
  image: z.url().optional(),
})
export type ProductVariant = z.infer<typeof productVariantSchema>

/**
 * The single fixed format every product is stored in, regardless of where it came from.
 * Import scripts transform their source data into this shape.
 * Anything that doesn't fit goes into `attributes` (shown to customers) or `meta` (internal).
 */
const productFieldsSchema = z.object({
  /** The product's id in its source system. Unique per source. */
  externalId: z.string().min(1).max(200),
  /** Optional; generated from the English title (or ids) on first import and never changed after. */
  slug: slugSchema.optional(),
  title: localizedTextSchema,
  description: localizedTextSchema.optional(),
  images: z.array(productImageSchema).min(1).max(20),
  videos: z.array(productVideoSchema).max(5).default([]),
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
  /** Empty = every combination of `options` is buyable at the product's price. */
  variants: z.array(productVariantSchema).max(200).default([]),
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

/** Stable key for a set of chosen option values. */
export const variantKey = (options: Record<string, string>) =>
  Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

/** The variant matching every chosen option exactly, if any. */
export const findVariant = <V extends { options: Record<string, string> }>(
  variants: V[],
  chosen: Record<string, string>,
): V | undefined => {
  const key = variantKey(chosen)
  return variants.find((v) => variantKey(v.options) === key)
}

/** Why a product's variants don't match its options, or null if they're fine. */
export const variantsIssue = (product: {
  options: { name: string; values: string[] }[]
  variants: { sku: string; options: Record<string, string> }[]
}): string | null => {
  if (product.variants.length === 0) return null
  if (product.options.length === 0) return 'variants need options to choose between'
  const skus = new Set<string>()
  const combos = new Set<string>()
  for (const v of product.variants) {
    if (skus.has(v.sku)) return `duplicate variant sku "${v.sku}"`
    skus.add(v.sku)
    if (Object.keys(v.options).length !== product.options.length)
      return `variant "${v.sku}" must set exactly the product's options`
    for (const o of product.options) {
      const value = v.options[o.name]
      if (!value || !o.values.includes(value))
        return `variant "${v.sku}" has no valid value for option "${o.name}"`
    }
    const combo = variantKey(v.options)
    if (combos.has(combo)) return `variant "${v.sku}" repeats another variant's options`
    combos.add(combo)
  }
  return null
}

export const productInputSchema = productFieldsSchema.superRefine((product, ctx) => {
  const issue = variantsIssue(product)
  if (issue) ctx.addIssue({ code: 'custom', path: ['variants'], message: issue })
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

// Built from the unrefined fields: refinements can't be partial. updateProduct re-checks variants.
export const productPatchSchema = productFieldsSchema
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
  videos: { url: string; poster?: string }[]
  /** Base price. A selected variant may have its own. */
  price: number
  compareAtPrice: number | null
  /** For products with variants: true if any variant is in stock. */
  inStock: boolean
  brandSlug: string | null
  categorySlugs: string[]
  options: { name: string; values: string[] }[]
  variants: PublicVariant[]
  attributes: { name: string; value: string }[]
  deliveryDays: { min: number; max: number } | null
  updatedAt: string
}

/** No cost price, no raw stock count. */
export type PublicVariant = {
  sku: string
  options: Record<string, string>
  price: number
  compareAtPrice: number | null
  inStock: boolean
  image: string | null
}

export type PublicProductCard = Pick<
  PublicProduct,
  'id' | 'slug' | 'title' | 'images' | 'price' | 'compareAtPrice' | 'inStock'
>
