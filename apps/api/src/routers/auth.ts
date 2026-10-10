import { loginSchema, type AuthResult } from '@123/shared'
import { TRPCError } from '@trpc/server'
import { ObjectId } from 'mongodb'
import { collections } from '../db/collections'
import type { AdminDoc } from '../db/types'
import { env } from '../env'
import { verifyPassword } from '../lib/crypto'
import { rateLimit } from '../lib/rate-limit'
import { parseCookies, setCookie } from '../lib/request'
import {
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from '../services/tokens'
import { adminProcedure, publicProcedure, router } from '../trpc/init'
import type { Context } from '../trpc/context'

const REFRESH_COOKIE = 'rt'

const writeRefreshCookie = (ctx: Context, token: string, maxAge: number) =>
  setCookie(ctx.res, REFRESH_COOKIE, token, {
    maxAge,
    path: '/trpc',
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
  })

const authResult = async (admin: AdminDoc): Promise<AuthResult> => ({
  accessToken: await signAccessToken({ sub: admin._id.toHexString(), email: admin.email }),
  expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  admin: { id: admin._id.toHexString(), email: admin.email, name: admin.name },
})

const unauthorized = () => new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    rateLimit(`login:${ctx.ip}`, 10, 15 * 60_000)
    const admin = await collections.admins().findOne({ email: input.email })
    if (!admin || !(await verifyPassword(input.password, admin.passwordHash))) throw unauthorized()

    await collections.admins().updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } })
    const refresh = await issueRefreshToken(admin._id)
    writeRefreshCookie(ctx, refresh.token, refresh.maxAgeSeconds)
    return authResult(admin)
  }),

  /** Exchanges the httpOnly refresh cookie for a new access token (and rotates the cookie). */
  refresh: publicProcedure.mutation(async ({ ctx }) => {
    rateLimit(`refresh:${ctx.ip}`, 60, 15 * 60_000)
    const token = parseCookies(ctx.req)[REFRESH_COOKIE]
    const rotated = token ? await rotateRefreshToken(token) : null
    const admin = rotated
      ? await collections.admins().findOne({ _id: new ObjectId(rotated.adminId) })
      : null
    if (!rotated || !admin) {
      writeRefreshCookie(ctx, '', 0)
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    writeRefreshCookie(ctx, rotated.token, rotated.maxAgeSeconds)
    return authResult(admin)
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token = parseCookies(ctx.req)[REFRESH_COOKIE]
    if (token) await revokeRefreshToken(token)
    writeRefreshCookie(ctx, '', 0)
    return { ok: true }
  }),

  me: adminProcedure.query(({ ctx }) => ({ id: ctx.admin.sub, email: ctx.admin.email })),
})
