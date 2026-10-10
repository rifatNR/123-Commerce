import { z } from 'zod'

export const visitorTrackSchema = z.object({
  visitorId: z.string().min(8).max(64),
  path: z.string().max(1000),
  referrer: z.string().max(2000).optional(),
  /** utm_*, fbclid, gclid, etc. captured from the landing URL. */
  params: z.record(z.string(), z.string().max(500)).default({}),
  screen: z.object({ w: z.number().int(), h: z.number().int() }).optional(),
  language: z.string().max(40).optional(),
})
export type VisitorTrackInput = z.infer<typeof visitorTrackSchema>

export const clientLogSchema = z.object({
  level: z.enum(['error', 'warn', 'info']),
  message: z.string().max(2000),
  stack: z.string().max(8000).optional(),
  path: z.string().max(1000).optional(),
  visitorId: z.string().max(64).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
})
