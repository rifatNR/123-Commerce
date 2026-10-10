import {
  PRODUCT_SCHEMA_VERSION,
  cacheKeys,
  slugify,
  type ProductInput,
  type ProductPatch,
} from '@123/shared'
import { TRPCError } from '@trpc/server'
import { type AnyBulkWriteOperation, type ObjectId } from 'mongodb'
import { collections } from '../db/collections'
import { ensureSourceIndexes } from '../db/indexes'
import type { ProductDoc, SourceProductDoc } from '../db/types'
import { hashJson, sha256 } from '../lib/crypto'
import { syncCache } from './cache-sync'
import { upsertCatalogRefs } from './catalog'
import { getProductPageData } from './storefront'

type ImportItem = { product: ProductInput; raw?: Record<string, unknown>; hash?: string }

/** Deterministic, URL-safe slug: readable part from the English title + short id hash. */
const generateSlug = (sourceSlug: string, product: ProductInput) => {
  const base = slugify(product.title.en ?? '') || 'product'
  return `${base.slice(0, 60)}-${sha256(`${sourceSlug}:${product.externalId}`).slice(0, 6)}`
}

/** Splits brand/category objects into slug references and upserts the catalog entries. */
const resolveCatalogRefs = async (products: Pick<ProductPatch, 'brand' | 'categories'>[]) => {
  await Promise.all([
    upsertCatalogRefs(
      'brand',
      products.flatMap((p) => (p.brand ? [p.brand] : [])),
    ),
    upsertCatalogRefs(
      'category',
      products.flatMap((p) => p.categories ?? []),
    ),
  ])
}

/** Converts input fields to stored fields. Only fields present in the input are returned. */
const toStoredFields = (input: ProductPatch): Partial<ProductDoc> => {
  const { brand, categories, visible, featured, ...rest } = input
  const fields: Partial<ProductDoc> = { ...rest }
  if (brand !== undefined) fields.brandSlug = brand?.slug ?? null
  if (categories !== undefined) fields.categorySlugs = categories.map((c) => c.slug)
  if (visible !== undefined) fields.visible = visible
  if (featured !== undefined) fields.featured = featured
  return fields
}

export const importProducts = async (sourceSlug: string, items: ImportItem[]) => {
  const source = await collections.sources().findOne({ slug: sourceSlug })
  if (!source) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Source "${sourceSlug}" does not exist. Create it first with sources.upsert.`,
    })
  }
  await resolveCatalogRefs(items.map((i) => i.product))

  const now = new Date()
  const productOps: AnyBulkWriteOperation<ProductDoc>[] = items.map(({ product }) => {
    const { externalId, slug, ...fields } = product
    const stored = toStoredFields(fields)
    return {
      updateOne: {
        filter: { sourceSlug, externalId },
        update: {
          $set: {
            ...stored,
            ...(slug ? { slug } : {}),
            brandSlug: product.brand?.slug ?? null,
            schemaVersion: PRODUCT_SCHEMA_VERSION,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
            ...(slug ? {} : { slug: generateSlug(sourceSlug, product) }),
            ...(product.visible === undefined ? { visible: true } : {}),
            ...(product.featured === undefined ? { featured: false } : {}),
          },
        },
        upsert: true,
      },
    }
  })

  const errors: { externalId: string; message: string }[] = []
  let upserted = 0
  let modified = 0
  try {
    const result = await collections.products().bulkWrite(productOps, { ordered: false })
    upserted = result.upsertedCount
    modified = result.modifiedCount
  } catch (err) {
    const writeErrors = (err as { writeErrors?: { index: number; errmsg?: string }[] }).writeErrors
    const result = (err as { result?: { upsertedCount: number; modifiedCount: number } }).result
    if (!writeErrors) throw err
    upserted = result?.upsertedCount ?? 0
    modified = result?.modifiedCount ?? 0
    for (const we of writeErrors) {
      errors.push({
        externalId: items[we.index]?.product.externalId ?? '?',
        message: we.errmsg ?? 'write failed',
      })
    }
  }

  const externalIds = items.map((i) => i.product.externalId)
  const idByExternal = new Map(
    (
      await collections
        .products()
        .find({ sourceSlug, externalId: { $in: externalIds } }, { projection: { externalId: 1 } })
        .toArray()
    ).map((d) => [d.externalId, d._id]),
  )

  await ensureSourceIndexes(sourceSlug)
  const sourceOps: AnyBulkWriteOperation<SourceProductDoc>[] = items.map(
    ({ product, raw, hash }) => ({
      updateOne: {
        filter: { externalId: product.externalId },
        update: {
          $set: {
            raw: raw ?? null,
            hash: hash ?? hashJson(raw ?? product),
            productId: idByExternal.get(product.externalId) ?? null,
            syncedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }),
  )
  await collections.sourceProducts(sourceSlug).bulkWrite(sourceOps, { ordered: false })

  syncCache({ bump: true })
  return { received: items.length, upserted, modified, errors }
}

/** Pushes the fresh product page into the frontend cache, then invalidates lists. */
const pushProductToCache = async (doc: ProductDoc) => {
  const page = await getProductPageData(doc.slug)
  syncCache({ bump: true, put: page ? [{ key: cacheKeys.product(doc.slug), value: page }] : [] })
}

export const updateProduct = async (
  filter: { _id: ObjectId } | { sourceSlug: string; externalId: string },
  patch: ProductPatch,
) => {
  await resolveCatalogRefs([patch])
  const doc = await collections
    .products()
    .findOneAndUpdate(
      filter,
      { $set: { ...toStoredFields(patch), updatedAt: new Date() } },
      { returnDocument: 'after' },
    )
  if (!doc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
  await pushProductToCache(doc)
  return doc
}

export const deleteProducts = async (
  filter: { ids: ObjectId[] } | { sourceSlug: string; externalIds: string[] },
) => {
  const query =
    'ids' in filter
      ? { _id: { $in: filter.ids } }
      : { sourceSlug: filter.sourceSlug, externalId: { $in: filter.externalIds } }
  const docs = await collections
    .products()
    .find(query, { projection: { sourceSlug: 1, externalId: 1 } })
    .toArray()
  const result = await collections.products().deleteMany(query)
  // Keep raw source records, just unlink them.
  const bySource = new Map<string, string[]>()
  for (const d of docs)
    bySource.set(d.sourceSlug, [...(bySource.get(d.sourceSlug) ?? []), d.externalId])
  await Promise.all(
    [...bySource].map(([slug, list]) =>
      collections
        .sourceProducts(slug)
        .updateMany({ externalId: { $in: list } }, { $set: { productId: null } }),
    ),
  )
  syncCache({ bump: true })
  return { deleted: result.deletedCount }
}
