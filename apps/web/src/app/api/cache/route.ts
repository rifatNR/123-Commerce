import type { CacheSyncOp } from '@123/shared'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { z } from 'zod'
import { bumpGeneration, getKv, putCached } from '@/lib/kv-cache'
import { logger } from '@/lib/logger'

const bodySchema = z.object({
  bump: z.boolean().optional(),
  put: z
    .array(
      z.object({
        key: z.string().min(1).max(500),
        value: z.unknown(),
        ttl: z.number().int().min(60).optional(),
      }),
    )
    .max(100)
    .optional(),
}) satisfies z.ZodType<CacheSyncOp>

const getSecret = async () => {
  if (process.env.CACHE_SYNC_SECRET) return process.env.CACHE_SYNC_SECRET
  try {
    const { env } = await getCloudflareContext({ async: true })
    if (env.CACHE_SYNC_SECRET) return env.CACHE_SYNC_SECRET
  } catch {
    // Not running on Cloudflare.
  }
  return undefined
}

/**
 * Backend -> frontend cache sync. The API calls this after data changes so Cloudflare KV
 * gets invalidated (generation bump) and/or receives fresh values.
 */
export async function POST(request: Request) {
  const secret = await getSecret()
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'invalid body' }, { status: 400 })

  const kv = await getKv()
  if (!kv) return Response.json({ ok: true, skipped: 'no kv binding' })

  const { bump, put = [] } = parsed.data
  const generation = bump ? await bumpGeneration(kv) : undefined
  await Promise.all(put.map((p) => putCached(kv, p.key, p.value, p.ttl)))
  logger.info('cache sync', { bump: Boolean(bump), puts: put.length, generation })
  return Response.json({ ok: true, generation, stored: put.length })
}
