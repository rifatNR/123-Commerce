import { CATALOG_KINDS, catalogUpdateSchema } from '@123/shared'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { catalogCollection, collections } from '../db/collections'
import { toCatalogDto } from '../mappers/catalog'
import { syncCache } from '../services/cache-sync'
import { adminProcedure, router } from '../trpc/init'

/** Admin control over which categories and brands are shown in the store. */
export const catalogRouter = router({
  list: adminProcedure.input(z.object({ kind: z.enum(CATALOG_KINDS) })).query(async ({ input }) => {
    const field = input.kind === 'category' ? '$categorySlugs' : '$brandSlug'
    const [docs, counts] = await Promise.all([
      catalogCollection(input.kind)
        .find({}, { sort: { sortOrder: 1, slug: 1 } })
        .toArray(),
      collections
        .products()
        .aggregate<{ _id: string; count: number }>([
          ...(input.kind === 'category' ? [{ $unwind: '$categorySlugs' }] : []),
          { $group: { _id: field, count: { $sum: 1 } } },
        ])
        .toArray(),
    ])
    const countBySlug = new Map(counts.map((c) => [c._id, c.count]))
    return docs.map((d) => toCatalogDto(d, countBySlug.get(d.slug) ?? 0))
  }),

  update: adminProcedure.input(catalogUpdateSchema).mutation(async ({ input }) => {
    const { kind, slug, ...fields } = input
    const doc = await catalogCollection(kind).findOneAndUpdate(
      { slug },
      { $set: { ...fields, updatedAt: new Date() } },
      { returnDocument: 'after' },
    )
    if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })
    syncCache({ bump: true })
    return toCatalogDto(doc)
  }),
})
