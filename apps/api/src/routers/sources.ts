import { sourceInputSchema, type SourceProductRef } from '@123/shared'
import { TRPCError } from '@trpc/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { collections } from '../db/collections'
import { ensureSourceIndexes } from '../db/indexes'
import { toSourceDto } from '../mappers/catalog'
import { syncCache } from '../services/cache-sync'
import { integrationProcedure, router } from '../trpc/init'

export const sourcesRouter = router({
  list: integrationProcedure.query(async () => {
    const [sources, counts] = await Promise.all([
      collections
        .sources()
        .find({}, { sort: { createdAt: 1 } })
        .toArray(),
      collections
        .products()
        .aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$sourceSlug', count: { $sum: 1 } } },
        ])
        .toArray(),
    ])
    const countBySlug = new Map(counts.map((c) => [c._id, c.count]))
    return sources.map((s) => toSourceDto(s, countBySlug.get(s.slug) ?? 0))
  }),

  /** Create or update a product source (a supplier, or "own" for your own stock). */
  upsert: integrationProcedure.input(sourceInputSchema).mutation(async ({ input }) => {
    const now = new Date()
    const { slug, ...fields } = input
    const doc = await collections.sources().findOneAndUpdate(
      { slug },
      {
        $set: { ...fields, updatedAt: now },
        $setOnInsert: { _id: new ObjectId(), slug, createdAt: now },
      },
      { upsert: true, returnDocument: 'after' },
    )
    if (!doc) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    await ensureSourceIndexes(slug)
    syncCache({ bump: true })
    const count = await collections.products().countDocuments({ sourceSlug: slug })
    return toSourceDto(doc, count)
  }),

  /**
   * Everything already imported for a source: lets the import script skip unchanged
   * records (compare `hash`) and detect removed ones.
   */
  productRefs: integrationProcedure
    .input(
      z.object({
        sourceSlug: z.string(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(5000).default(5000),
      }),
    )
    .query(async ({ input }): Promise<{ items: SourceProductRef[]; total: number }> => {
      const col = collections.sourceProducts(input.sourceSlug)
      const [docs, total] = await Promise.all([
        col
          .find(
            {},
            {
              projection: { externalId: 1, hash: 1, productId: 1, syncedAt: 1 },
              sort: { _id: 1 },
              skip: (input.page - 1) * input.limit,
              limit: input.limit,
            },
          )
          .toArray(),
        col.countDocuments(),
      ])
      return {
        items: docs.map((d) => ({
          externalId: d.externalId,
          hash: d.hash,
          productId: d.productId?.toHexString() ?? null,
          syncedAt: d.syncedAt.toISOString(),
        })),
        total,
      }
    }),

  /** The raw, untouched source record. */
  rawProduct: integrationProcedure
    .input(z.object({ sourceSlug: z.string(), externalId: z.string() }))
    .query(async ({ input }) => {
      const doc = await collections
        .sourceProducts(input.sourceSlug)
        .findOne({ externalId: input.externalId })
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })
      return {
        externalId: doc.externalId,
        raw: doc.raw,
        hash: doc.hash,
        syncedAt: doc.syncedAt.toISOString(),
      }
    }),
})
