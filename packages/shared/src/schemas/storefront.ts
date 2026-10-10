import { z } from 'zod'
import { PRODUCT_SORTS } from '../constants'
import type { CatalogItemDto } from './catalog'
import type { PublicProduct, PublicProductCard } from './product'

export const productListQuerySchema = z.object({
  category: z.string().max(120).optional(),
  brand: z.string().max(120).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(PRODUCT_SORTS).default('newest'),
  page: z.number().int().min(1).max(500).default(1),
})
export type ProductListQuery = z.infer<typeof productListQuerySchema>

export type StoreCatalog = { categories: CatalogItemDto[]; brands: CatalogItemDto[] }
export type StoreConfig = { deliveryFees: { inside_dhaka: number; outside_dhaka: number } }
export type HomeData = { featured: PublicProductCard[]; latest: PublicProductCard[] }
export type ProductListResult = {
  items: PublicProductCard[]
  total: number
  page: number
  pageSize: number
}
export type ProductPageData = {
  product: PublicProduct
  brand: CatalogItemDto | null
  categories: CatalogItemDto[]
  related: PublicProductCard[]
}
export type SitemapData = {
  products: { slug: string; updatedAt: string }[]
  categories: string[]
}
