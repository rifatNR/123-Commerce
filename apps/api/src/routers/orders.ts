import {
  objectIdSchema,
  orderCreateSchema,
  orderItemDropshipSchema,
  orderListSchema,
  orderStatusUpdateSchema,
  type OrderStatus,
  type Paginated,
  type OrderDto,
} from '@123/shared'
import { TRPCError } from '@trpc/server'
import { ObjectId, type Filter } from 'mongodb'
import { z } from 'zod'
import { collections } from '../db/collections'
import type { OrderDoc } from '../db/types'
import { logger } from '../lib/logger'
import { rateLimit } from '../lib/rate-limit'
import { toOrderDto } from '../mappers/order'
import { autoDropshipSources, getDropshipProvider } from '../services/dropship/registry'
import { advanceIfAllPlaced, createOrder } from '../services/orders'
import { adminProcedure, publicProcedure, router } from '../trpc/init'

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const findOrder = async (id: string) => {
  const order = await collections.orders().findOne({ _id: new ObjectId(id) })
  if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
  return order
}

export const ordersRouter = router({
  create: publicProcedure.input(orderCreateSchema).mutation(({ ctx, input }) => {
    rateLimit(`order:${ctx.ip}`, 5, 10 * 60_000)
    return createOrder(input, { ip: ctx.ip, userAgent: ctx.userAgent })
  }),

  list: adminProcedure
    .input(orderListSchema)
    .query(async ({ input }): Promise<Paginated<OrderDto>> => {
      const filter: Filter<OrderDoc> = {}
      if (input.status) filter.status = input.status
      if (input.q) {
        const re = new RegExp(escapeRegex(input.q), 'i')
        filter.$or = [{ orderNumber: input.q }, { 'customer.phone': re }, { 'customer.name': re }]
      }
      const [docs, total] = await Promise.all([
        collections
          .orders()
          .find(filter, {
            sort: { createdAt: -1 },
            skip: (input.page - 1) * input.limit,
            limit: input.limit,
          })
          .toArray(),
        collections.orders().countDocuments(filter),
      ])
      return { items: docs.map(toOrderDto), total, page: input.page, limit: input.limit }
    }),

  counts: adminProcedure.query(async () => {
    const rows = await collections
      .orders()
      .aggregate<{ _id: OrderStatus; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray()
    return Object.fromEntries(rows.map((r) => [r._id, r.count])) as Partial<
      Record<OrderStatus, number>
    >
  }),

  get: adminProcedure.input(z.object({ id: objectIdSchema })).query(async ({ input }) => {
    const order = await findOrder(input.id)
    const customer = await collections.customers().findOne({ phone: order.customer.phone })
    return {
      order: toOrderDto(order),
      customerOrderCount: customer?.orderCount ?? 1,
      autoDropshipSources: autoDropshipSources(),
    }
  }),

  updateStatus: adminProcedure.input(orderStatusUpdateSchema).mutation(async ({ input }) => {
    const now = new Date()
    const order = await collections.orders().findOneAndUpdate(
      { _id: new ObjectId(input.id) },
      {
        $set: { status: input.status, updatedAt: now },
        $push: { statusHistory: { status: input.status, at: now, note: input.note ?? null } },
      },
      { returnDocument: 'after' },
    )
    if (!order) throw new TRPCError({ code: 'NOT_FOUND' })
    return toOrderDto(order)
  }),

  updateNote: adminProcedure
    .input(z.object({ id: objectIdSchema, note: z.string().max(5000) }))
    .mutation(async ({ input }) => {
      await collections
        .orders()
        .updateOne(
          { _id: new ObjectId(input.id) },
          { $set: { adminNote: input.note || null, updatedAt: new Date() } },
        )
      return { ok: true }
    }),

  /** Manual "Drop Shipping Process": admin placed this item with the supplier by hand. */
  markItemDropship: adminProcedure.input(orderItemDropshipSchema).mutation(async ({ input }) => {
    const order = await findOrder(input.id)
    if (!order.items[input.itemIndex])
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid item' })
    const prefix = `items.${input.itemIndex}.dropship`
    await collections.orders().updateOne(
      { _id: order._id },
      {
        $set: {
          [`${prefix}.placed`]: input.placed,
          [`${prefix}.placedAt`]: input.placed ? new Date() : null,
          [`${prefix}.supplierOrderId`]: input.supplierOrderId ?? null,
          updatedAt: new Date(),
        },
      },
    )
    const updated = await advanceIfAllPlaced(order._id)
    return toOrderDto(updated ?? (await findOrder(input.id)))
  }),

  /** Automatic placement through a supplier API (only for sources with a registered provider). */
  placeItemToDropship: adminProcedure
    .input(z.object({ id: objectIdSchema, itemIndex: z.number().int().min(0) }))
    .mutation(async ({ input }) => {
      const order = await findOrder(input.id)
      const item = order.items[input.itemIndex]
      if (!item) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid item' })
      if (item.dropship.placed)
        throw new TRPCError({ code: 'CONFLICT', message: 'Item already placed' })
      const provider = getDropshipProvider(item.sourceSlug)
      const source = await collections.sources().findOne({ slug: item.sourceSlug })
      if (!provider || !source) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'No automatic provider for this source',
        })
      }
      const { supplierOrderId } = await provider.placeOrder({ order, item, source })
      logger.info('dropship order placed', { orderNumber: order.orderNumber, supplierOrderId })
      const prefix = `items.${input.itemIndex}.dropship`
      await collections.orders().updateOne(
        { _id: order._id },
        {
          $set: {
            [`${prefix}.placed`]: true,
            [`${prefix}.placedAt`]: new Date(),
            [`${prefix}.supplierOrderId`]: supplierOrderId,
            updatedAt: new Date(),
          },
        },
      )
      const updated = await advanceIfAllPlaced(order._id)
      return toOrderDto(updated ?? (await findOrder(input.id)))
    }),
})
