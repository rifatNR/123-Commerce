import { productListQuerySchema, type StoreConfig } from '@123/shared'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { deliveryFees } from '../services/orders'
import {
  getHomeData,
  getProductPageData,
  getSitemapData,
  getStoreCatalog,
  listProducts,
} from '../services/storefront'
import { publicProcedure, router } from '../trpc/init'

/** Read-only public data. The frontend caches every response in Cloudflare KV. */
export const storefrontRouter = router({
  config: publicProcedure.query((): StoreConfig => ({ deliveryFees: deliveryFees() })),
  home: publicProcedure.query(() => getHomeData()),
  catalog: publicProcedure.query(() => getStoreCatalog()),
  products: publicProcedure.input(productListQuerySchema).query(({ input }) => listProducts(input)),
  product: publicProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ input }) => {
      const data = await getProductPageData(input.slug)
      if (!data) throw new TRPCError({ code: 'NOT_FOUND' })
      return data
    }),
  sitemap: publicProcedure.query(() => getSitemapData()),
})
