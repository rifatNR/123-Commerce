import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'
import { env } from '../env'
import { safeEqual } from '../lib/crypto'
import { getClientIp, getHeader } from '../lib/request'
import { verifyAccessToken } from '../services/tokens'

export const createContext = async ({ req, res }: CreateHTTPContextOptions) => {
  const bearer = getHeader(req, 'authorization')?.match(/^Bearer (.+)$/i)?.[1]
  const apiKey = getHeader(req, 'x-api-key')
  return {
    req,
    res,
    ip: getClientIp(req),
    userAgent: getHeader(req, 'user-agent') ?? null,
    admin: bearer ? await verifyAccessToken(bearer) : null,
    hasIngestKey: Boolean(apiKey && safeEqual(apiKey, env.INGEST_API_KEY)),
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
