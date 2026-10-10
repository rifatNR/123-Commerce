import type { CatalogRef } from '@123/shared'
import { ObjectId, type AnyBulkWriteOperation, type Filter } from 'mongodb'
import { catalogCollection, collections } from '../db/collections'
import type { CatalogDoc, ProductDoc } from '../db/types'

/** Creates brands/categories referenced by products if they don't exist yet. Never overwrites admin edits. */
export const upsertCatalogRefs = async (kind: 'category' | 'brand', refs: CatalogRef[]) => {
  const unique = [...new Map(refs.map((r) => [r.slug, r])).values()]
  if (unique.length === 0) return
  const now = new Date()
  const ops: AnyBulkWriteOperation<CatalogDoc>[] = unique.map((ref) => ({
    updateOne: {
      filter: { slug: ref.slug },
      update: {
        $setOnInsert: {
          _id: new ObjectId(),
          slug: ref.slug,
          name: ref.name,
          image: null,
          visible: true,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
      },
      upsert: true,
    },
  }))
  await catalogCollection(kind).bulkWrite(ops, { ordered: false })
}

const hiddenSlugs = async (kind: 'category' | 'brand') =>
  (
    await catalogCollection(kind)
      .find({ visible: false }, { projection: { slug: 1 } })
      .toArray()
  ).map((d) => d.slug)

/** A product is public only if it, its source, its brand and all its categories are visible. */
export const publicProductFilter = async (): Promise<Filter<ProductDoc>> => {
  const [hiddenCategories, hiddenBrands, inactiveSources] = await Promise.all([
    hiddenSlugs('category'),
    hiddenSlugs('brand'),
    collections
      .sources()
      .find({ active: false }, { projection: { slug: 1 } })
      .toArray()
      .then((docs) => docs.map((d) => d.slug)),
  ])
  const filter: Filter<ProductDoc> = { visible: true }
  if (hiddenCategories.length) filter.categorySlugs = { $nin: hiddenCategories }
  if (hiddenBrands.length) filter.brandSlug = { $nin: hiddenBrands }
  if (inactiveSources.length) filter.sourceSlug = { $nin: inactiveSources }
  return filter
}
