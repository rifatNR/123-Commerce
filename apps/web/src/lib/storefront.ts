import 'server-only'
import { cacheKeys, productListQuerySchema, type ProductPageData } from '@123/shared'
import { TRPCClientError } from '@trpc/client'
import { cache } from 'react'
import { cached } from './kv-cache'
import { serverApi } from './server-api'

/**
 * All public data goes through here: Cloudflare KV first, backend API on a miss.
 * React `cache` dedupes calls within one request (e.g. generateMetadata + page).
 */
export const getStoreConfig = cache(() =>
  cached(cacheKeys.config(), async () => (await serverApi()).storefront.config.query()),
)

export const getCatalog = cache(() =>
  cached(cacheKeys.catalog(), async () => (await serverApi()).storefront.catalog.query()),
)

export const getHome = cache(() =>
  cached(cacheKeys.home(), async () => (await serverApi()).storefront.home.query()),
)

export const getProductList = cache((params: Record<string, string | string[] | undefined>) => {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined
  const parsed = productListQuerySchema.safeParse({
    category: first(params.category),
    brand: first(params.brand),
    q: first(params.q),
    sort: first(params.sort),
    page: Number(first(params.page) ?? 1) || 1,
  })
  const query = parsed.success ? parsed.data : productListQuerySchema.parse({})
  return cached(cacheKeys.productList(query), async () =>
    (await serverApi()).storefront.products.query(query),
  ).then((result) => ({ query, result }))
})

export const getProductPage = cache((slug: string) =>
  cached(cacheKeys.product(slug), async (): Promise<ProductPageData | null> => {
    try {
      return await (await serverApi()).storefront.product.query({ slug })
    } catch (err) {
      if (err instanceof TRPCClientError && err.data?.code === 'NOT_FOUND') return null
      throw err
    }
  }),
)

export const getSitemap = () =>
  cached(cacheKeys.sitemap(), async () => (await serverApi()).storefront.sitemap.query())
