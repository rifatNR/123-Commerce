import type { CacheSyncOp } from '@123/shared'
import { env } from '../env'
import { logger } from '../lib/logger'

/**
 * Pushes cache updates to the frontend's /api/cache route, which writes to Cloudflare KV.
 * Calls are coalesced for a short moment so a bulk import causes a single KV write.
 */
const FLUSH_DELAY_MS = 1500

let pending: { bump: boolean; put: Map<string, { value: unknown; ttl?: number }> } = {
  bump: false,
  put: new Map(),
}
let timer: NodeJS.Timeout | null = null

const flush = async () => {
  timer = null
  const batch = pending
  pending = { bump: false, put: new Map() }
  if (!env.FRONTEND_CACHE_SYNC_URL || !env.CACHE_SYNC_SECRET) return

  const body: CacheSyncOp = {
    bump: batch.bump,
    put: [...batch.put].map(([key, { value, ttl }]) => ({ key, value, ttl })),
  }
  try {
    const res = await fetch(env.FRONTEND_CACHE_SYNC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.CACHE_SYNC_SECRET}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) logger.warn('cache sync failed', { status: res.status, body: await res.text() })
    else logger.debug('cache synced', { bump: body.bump, puts: body.put?.length })
  } catch (err) {
    logger.warn('cache sync unreachable', { err })
  }
}

export const syncCache = (op: CacheSyncOp) => {
  if (op.bump) pending.bump = true
  for (const { key, value, ttl } of op.put ?? []) pending.put.set(key, { value, ttl })
  timer ??= setTimeout(() => void flush(), FLUSH_DELAY_MS)
}

/** Shorthand for "data changed, drop everything cached". */
export const invalidateCache = () => syncCache({ bump: true })
