import { clientLogSchema, visitorTrackSchema } from '@123/shared'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { collections } from '../db/collections'
import type { VisitTouch } from '../db/types'
import { logger } from '../lib/logger'
import { rateLimit } from '../lib/rate-limit'
import { parseUserAgent } from '../lib/user-agent'
import { adminProcedure, publicProcedure, router } from '../trpc/init'

const MAX_SESSIONS = 50

export const visitorsRouter = router({
  /** Called once per browser session by the storefront. */
  track: publicProcedure.input(visitorTrackSchema).mutation(async ({ ctx, input }) => {
    rateLimit(`track:${ctx.ip}`, 60, 60_000)
    const now = new Date()
    const touch: VisitTouch = {
      at: now,
      path: input.path,
      referrer: input.referrer || null,
      params: input.params,
      ip: ctx.ip,
    }
    await collections.visitors().updateOne(
      { visitorId: input.visitorId },
      {
        $set: {
          lastSeenAt: now,
          userAgent: ctx.userAgent,
          device: parseUserAgent(ctx.userAgent),
          language: input.language ?? null,
          screen: input.screen ?? null,
        },
        $inc: { visits: 1 },
        ...(ctx.ip ? { $addToSet: { ips: ctx.ip } } : {}),
        $push: { sessions: { $each: [touch], $slice: -MAX_SESSIONS } },
        $setOnInsert: { _id: new ObjectId(), firstSeenAt: now, firstTouch: touch },
      },
      { upsert: true },
    )
    return { ok: true }
  }),

  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const docs = await collections
        .visitors()
        .find(
          {},
          { sort: { lastSeenAt: -1 }, skip: (input.page - 1) * input.limit, limit: input.limit },
        )
        .toArray()
      return docs.map(({ _id, ...rest }) => ({ id: _id.toHexString(), ...rest }))
    }),

  /** Frontend error reporting. */
  log: publicProcedure.input(clientLogSchema).mutation(async ({ ctx, input }) => {
    rateLimit(`log:${ctx.ip}`, 20, 60_000)
    logger.warn('client log', { ...input, ip: ctx.ip })
    await collections.clientLogs().insertOne({
      _id: new ObjectId(),
      ...input,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      createdAt: new Date(),
    })
    return { ok: true }
  }),
})
