import { TRPCError } from '@trpc/server'

/**
 * Tiny in-memory fixed-window rate limiter. Good enough for a single API instance;
 * swap for a shared store (e.g. Redis) if you ever run several instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export const rateLimit = (key: string, max: number, windowMs: number) => {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  bucket.count += 1
  if (bucket.count > max) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'অনেকবার চেষ্টা করা হয়েছে। একটু পরে আবার চেষ্টা করুন।',
    })
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key)
}, 60_000).unref()
