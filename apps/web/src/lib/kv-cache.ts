import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { logger } from './logger'

/**
 * Cloudflare KV is used ONLY as a cache for API responses.
 *
 * Every logical key is stored as `g<generation>:<key>`. The backend bumps the generation
 * (one KV write) whenever data changes, which invalidates everything at once; old entries
 * simply expire through their TTL.
 */
const GEN_KEY = 'meta:generation'
const GEN_MEMO_MS = 10_000

let memo: { gen: string; at: number } | null = null

export const getKv = async (): Promise<CacheKvNamespace | null> => {
  try {
    const { env } = await getCloudflareContext({ async: true })
    return env.CACHE_KV ?? null
  } catch {
    return null
  }
}

const defaultTtl = async () => {
  if (process.env.CACHE_TTL_SECONDS) return Number(process.env.CACHE_TTL_SECONDS)
  try {
    const { env } = await getCloudflareContext({ async: true })
    return Number(env.CACHE_TTL_SECONDS ?? 3600)
  } catch {
    return 3600
  }
}

const getGeneration = async (kv: CacheKvNamespace) => {
  if (memo && Date.now() - memo.at < GEN_MEMO_MS) return memo.gen
  const gen = (await kv.get(GEN_KEY)) ?? '0'
  memo = { gen, at: Date.now() }
  return gen
}

const fullKey = (gen: string, key: string) => `g${gen}:${key}`

/** Reads from KV; on a miss, calls `fetcher` and stores the result for next time. */
export const cached = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> => {
  const kv = await getKv()
  if (!kv) return fetcher()

  let k: string | null = null
  try {
    k = fullKey(await getGeneration(kv), key)
    const hit = await kv.get(k, 'json')
    if (hit !== null) return hit as T
  } catch (err) {
    logger.warn('kv read failed', { key, err })
  }

  const data = await fetcher()
  if (k && data !== undefined && data !== null) {
    const write = kv
      .put(k, JSON.stringify(data), { expirationTtl: ttl ?? (await defaultTtl()) })
      .catch((err) => logger.warn('kv write failed', { key, err }))
    try {
      getCloudflareContext().ctx.waitUntil(write)
    } catch {
      await write
    }
  }
  return data
}

export const bumpGeneration = async (kv: CacheKvNamespace) => {
  const next = String(Number((await kv.get(GEN_KEY)) ?? '0') + 1)
  await kv.put(GEN_KEY, next)
  memo = { gen: next, at: Date.now() }
  return next
}

export const putCached = async (
  kv: CacheKvNamespace,
  key: string,
  value: unknown,
  ttl?: number,
) => {
  const gen = await getGeneration(kv)
  await kv.put(fullKey(gen, key), JSON.stringify(value), {
    expirationTtl: ttl ?? (await defaultTtl()),
  })
}
