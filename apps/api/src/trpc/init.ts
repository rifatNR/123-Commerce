import { TRPCError, initTRPC } from '@trpc/server'
import { ZodError, z } from 'zod'
import type { Context } from './context'

const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
    },
  }),
})

export const router = t.router
export const publicProcedure = t.procedure

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.admin) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, admin: ctx.admin } })
})

/** For the product import script (x-api-key header) and logged-in admins. */
export const integrationProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.admin && !ctx.hasIngestKey) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next()
})
