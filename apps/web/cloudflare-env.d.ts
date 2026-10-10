// Bindings available to the Worker (see wrangler.jsonc). Kept minimal on purpose;
// run `pnpm --filter @123/web cf:typegen` if you want the full generated runtime types.

/** The subset of the Workers KV API we use. */
interface CacheKvNamespace {
  get(key: string, type: 'json'): Promise<unknown>
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

interface CloudflareEnv {
  CACHE_KV?: CacheKvNamespace
  API_INTERNAL_URL?: string
  CACHE_TTL_SECONDS?: string
  CACHE_SYNC_SECRET?: string
}
