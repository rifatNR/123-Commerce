import {
  PAGE_SIZE,
  type HomeData,
  type ProductListQuery,
  type ProductListResult,
  type ProductPageData,
  type SitemapData,
  type StoreCatalog,
} from '@123/shared'
import type { Filter, Sort } from 'mongodb'
import { collections } from '../db/collections'
import type { ProductDoc } from '../db/types'
import { toCatalogDto } from '../mappers/catalog'
import { cardProjection, toPublicCard, toPublicProduct } from '../mappers/product'
import { publicProductFilter } from './catalog'

const SORTS: Record<ProductListQuery['sort'], Sort> = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
}

const findCards = async (filter: Filter<ProductDoc>, sort: Sort, limit: number, skip = 0) =>
  (
    await collections
      .products()
      .find(filter, { projection: cardProjection, sort, limit, skip })
      .toArray()
  ).map(toPublicCard)

export const getHomeData = async (): Promise<HomeData> => {
  const filter = await publicProductFilter()
  const [featured, latest] = await Promise.all([
    findCards({ ...filter, featured: true }, SORTS.newest, 12),
    findCards(filter, SORTS.newest, 24),
  ])
  return { featured, latest }
}

export const listProducts = async (query: ProductListQuery): Promise<ProductListResult> => {
  const filter: Filter<ProductDoc> = await publicProductFilter()
  const and: Filter<ProductDoc>[] = [filter]
  if (query.category) and.push({ categorySlugs: query.category })
  if (query.brand) and.push({ brandSlug: query.brand })
  if (query.q) and.push({ $text: { $search: query.q } })
  const finalFilter = and.length === 1 ? filter : { $and: and }

  const skip = (query.page - 1) * PAGE_SIZE
  const [items, total] = await Promise.all([
    findCards(finalFilter, SORTS[query.sort], PAGE_SIZE, skip),
    collections.products().countDocuments(finalFilter),
  ])
  return { items, total, page: query.page, pageSize: PAGE_SIZE }
}

export const getProductPageData = async (slug: string): Promise<ProductPageData | null> => {
  const filter = await publicProductFilter()
  const doc = await collections.products().findOne({ ...filter, slug })
  if (!doc) return null

  const [brand, categories, related] = await Promise.all([
    doc.brandSlug ? collections.brands().findOne({ slug: doc.brandSlug }) : null,
    collections
      .categories()
      .find({ slug: { $in: doc.categorySlugs } })
      .toArray(),
    doc.categorySlugs.length
      ? findCards(
          { ...filter, categorySlugs: { $in: doc.categorySlugs }, _id: { $ne: doc._id } },
          SORTS.newest,
          8,
        )
      : Promise.resolve([]),
  ])
  return {
    product: toPublicProduct(doc),
    brand: brand ? toCatalogDto(brand) : null,
    categories: categories.map((c) => toCatalogDto(c)),
    related,
  }
}

export const getStoreCatalog = async (): Promise<StoreCatalog> => {
  const sort: Sort = { sortOrder: 1, slug: 1 }
  const [categories, brands] = await Promise.all([
    collections.categories().find({ visible: true }, { sort }).toArray(),
    collections.brands().find({ visible: true }, { sort }).toArray(),
  ])
  return {
    categories: categories.map((c) => toCatalogDto(c)),
    brands: brands.map((b) => toCatalogDto(b)),
  }
}

export const getSitemapData = async (): Promise<SitemapData> => {
  const filter = await publicProductFilter()
  const [products, categories] = await Promise.all([
    collections
      .products()
      .find(filter, {
        projection: { slug: 1, updatedAt: 1 },
        sort: { updatedAt: -1 },
        limit: 20000,
      })
      .toArray(),
    collections
      .categories()
      .find({ visible: true }, { projection: { slug: 1 } })
      .toArray(),
  ])
  return {
    products: products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt.toISOString() })),
    categories: categories.map((c) => c.slug),
  }
}
