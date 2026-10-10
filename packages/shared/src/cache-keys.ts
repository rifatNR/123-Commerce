import type { ProductListQuery } from './schemas/storefront'

/**
 * Logical KV cache keys shared by the backend (which pushes data) and the frontend (which reads it).
 * The frontend prefixes every key with the current cache generation, so bumping the
 * generation invalidates everything with a single KV write.
 */
export const cacheKeys = {
  home: () => 'home',
  config: () => 'config',
  catalog: () => 'catalog',
  sitemap: () => 'sitemap',
  product: (slug: string) => `product:${slug}`,
  productList: (q: ProductListQuery) =>
    `products:${[q.category ?? '', q.brand ?? '', q.q ?? '', q.sort, q.page].join('|')}`,
}

export type CacheSyncOp = {
  /** Invalidate every cached entry by bumping the generation. */
  bump?: boolean
  /** Fresh values to store under logical keys (after the bump, if any). */
  put?: { key: string; value: unknown; ttl?: number }[]
}
