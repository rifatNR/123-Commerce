import {
  objectIdSchema,
  productImportSchema,
  productPatchSchema,
  type Paginated,
  type ProductDto,
} from '@123/shared'
import { TRPCError } from '@trpc/server'
import { ObjectId, type Filter } from 'mongodb'
import { z } from 'zod'
import { collections } from '../db/collections'
import type { ProductDoc } from '../db/types'
import { toProductDto } from '../mappers/product'
import { syncCache } from '../services/cache-sync'
import { deleteProducts, importProducts, updateProduct } from '../services/products'
import { adminProcedure, integrationProcedure, router } from '../trpc/init'

const byExternal = z.object({ sourceSlug: z.string(), externalId: z.string() })

/** Product management for the import script (x-api-key) and the admin panel. */
export const productsRouter = router({
  /** Bulk create/update in the fixed product format. Send at most 200 items per call. */
  import: integrationProcedure
    .input(productImportSchema)
    .mutation(({ input }) => importProducts(input.sourceSlug, input.items)),

  list: integrationProcedure
    .input(
      z.object({
        sourceSlug: z.string().optional(),
        q: z.string().trim().max(100).optional(),
        visible: z.boolean().optional(),
        externalIds: z.array(z.string()).max(1000).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(500).default(50),
      }),
    )
    .query(async ({ input }): Promise<Paginated<ProductDto>> => {
      const filter: Filter<ProductDoc> = {}
      if (input.sourceSlug) filter.sourceSlug = input.sourceSlug
      if (input.visible !== undefined) filter.visible = input.visible
      if (input.externalIds) filter.externalId = { $in: input.externalIds }
      if (input.q) filter.$text = { $search: input.q }
      const [docs, total] = await Promise.all([
        collections
          .products()
          .find(filter, {
            sort: { createdAt: -1 },
            skip: (input.page - 1) * input.limit,
            limit: input.limit,
          })
          .toArray(),
        collections.products().countDocuments(filter),
      ])
      return { items: docs.map(toProductDto), total, page: input.page, limit: input.limit }
    }),

  get: integrationProcedure
    .input(z.union([z.object({ id: objectIdSchema }), byExternal]))
    .query(async ({ input }) => {
      const doc = await collections
        .products()
        .findOne('id' in input ? { _id: new ObjectId(input.id) } : input)
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' })
      return toProductDto(doc)
    }),

  update: integrationProcedure
    .input(z.object({ id: objectIdSchema, patch: productPatchSchema }))
    .mutation(async ({ input }) =>
      toProductDto(await updateProduct({ _id: new ObjectId(input.id) }, input.patch)),
    ),

  updateByExternalId: integrationProcedure
    .input(byExternal.extend({ patch: productPatchSchema }))
    .mutation(async ({ input }) =>
      toProductDto(
        await updateProduct(
          { sourceSlug: input.sourceSlug, externalId: input.externalId },
          input.patch,
        ),
      ),
    ),

  delete: integrationProcedure
    .input(z.object({ ids: z.array(objectIdSchema).min(1).max(1000) }))
    .mutation(({ input }) => deleteProducts({ ids: input.ids.map((id) => new ObjectId(id)) })),

  deleteByExternalIds: integrationProcedure
    .input(z.object({ sourceSlug: z.string(), externalIds: z.array(z.string()).min(1).max(1000) }))
    .mutation(({ input }) => deleteProducts(input)),

  /** Bulk show/hide or feature products from the admin panel. */
  setFlags: adminProcedure
    .input(
      z.object({
        ids: z.array(objectIdSchema).min(1).max(500),
        visible: z.boolean().optional(),
        featured: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const set: Partial<ProductDoc> = { updatedAt: new Date() }
      if (input.visible !== undefined) set.visible = input.visible
      if (input.featured !== undefined) set.featured = input.featured
      const result = await collections
        .products()
        .updateMany({ _id: { $in: input.ids.map((id) => new ObjectId(id)) } }, { $set: set })
      syncCache({ bump: true })
      return { modified: result.modifiedCount }
    }),
})
