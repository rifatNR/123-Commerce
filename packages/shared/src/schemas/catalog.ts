import { z } from 'zod'
import { localizedTextSchema, slugSchema, type LocalizedText } from './common'

export const CATALOG_KINDS = ['category', 'brand'] as const
export type CatalogKind = (typeof CATALOG_KINDS)[number]

export const catalogUpdateSchema = z.object({
  kind: z.enum(CATALOG_KINDS),
  slug: slugSchema,
  name: localizedTextSchema.optional(),
  image: z.url().nullable().optional(),
  visible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export type CatalogItemDto = {
  slug: string
  name: LocalizedText
  image: string | null
  visible: boolean
  sortOrder: number
  productCount?: number
}
