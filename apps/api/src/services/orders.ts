import type { OrderCreateInput, OrderCreatedDto } from '@123/shared'
import { TRPCError } from '@trpc/server'
import { ObjectId } from 'mongodb'
import { collections } from '../db/collections'
import type { OrderDoc, OrderItemDoc } from '../db/types'
import { env } from '../env'
import { logger } from '../lib/logger'
import { parseUserAgent } from '../lib/user-agent'
import { publicProductFilter } from './catalog'
import { nextOrderNumber } from './order-number'

export const deliveryFees = () => ({
  inside_dhaka: env.DELIVERY_FEE_INSIDE_DHAKA,
  outside_dhaka: env.DELIVERY_FEE_OUTSIDE_DHAKA,
})

const fail = (message: string): never => {
  throw new TRPCError({ code: 'BAD_REQUEST', message })
}

/** Prices always come from the database, never from the client. */
export const createOrder = async (
  input: OrderCreateInput,
  meta: { ip: string | null; userAgent: string | null },
): Promise<OrderCreatedDto> => {
  const ids = [...new Set(input.items.map((i) => i.productId))].map((id) => new ObjectId(id))
  const filter = await publicProductFilter()
  const products = await collections
    .products()
    .find({ ...filter, _id: { $in: ids } })
    .toArray()
  const byId = new Map(products.map((p) => [p._id.toHexString(), p]))

  const items: OrderItemDoc[] = input.items.map((line) => {
    const product =
      byId.get(line.productId) ?? fail('কিছু পণ্য এখন আর পাওয়া যাচ্ছে না। কার্ট আপডেট করুন।')
    for (const option of product.options) {
      const chosen = line.options[option.name]
      if (!chosen || !option.values.includes(chosen)) fail(`"${option.name}" নির্বাচন করুন`)
    }
    if (typeof product.stock === 'number' && product.stock < line.quantity)
      fail('পর্যাপ্ত স্টক নেই')
    return {
      productId: product._id,
      slug: product.slug,
      title: product.title,
      image: product.images[0]?.url ?? null,
      price: product.price,
      costPrice: product.costPrice ?? null,
      quantity: line.quantity,
      options: Object.fromEntries(product.options.map((o) => [o.name, line.options[o.name] ?? ''])),
      sourceSlug: product.sourceSlug,
      externalId: product.externalId,
      fulfillment: product.fulfillment,
      dropship: { placed: false, placedAt: null, supplierOrderId: null },
    }
  })

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const deliveryFee = deliveryFees()[input.customer.deliveryZone]
  const now = new Date()
  const order: OrderDoc = {
    _id: new ObjectId(),
    orderNumber: await nextOrderNumber(),
    status: 'new',
    customer: input.customer,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryZone: input.customer.deliveryZone,
    visitorId: input.visitorId ?? null,
    attribution: input.attribution ?? {},
    ip: meta.ip,
    userAgent: meta.userAgent,
    device: parseUserAgent(meta.userAgent),
    adminNote: null,
    statusHistory: [{ status: 'new', at: now, note: null }],
    createdAt: now,
    updatedAt: now,
  }
  await collections.orders().insertOne(order)
  logger.info('order created', { orderNumber: order.orderNumber, total: order.total })

  await collections.customers().updateOne(
    { phone: input.customer.phone },
    {
      $set: { name: input.customer.name, lastOrderAt: now },
      $addToSet: {
        addresses: input.customer.address,
        ...(input.visitorId ? { visitorIds: input.visitorId } : {}),
      },
      $inc: { orderCount: 1, totalSpent: order.total },
      $setOnInsert: { firstOrderAt: now },
    },
    { upsert: true },
  )

  return {
    orderNumber: order.orderNumber,
    subtotal,
    deliveryFee,
    total: order.total,
    items: items.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price })),
  }
}

/** Once every dropship item is placed with its supplier, move the order forward automatically. */
export const advanceIfAllPlaced = async (orderId: ObjectId) => {
  const order = await collections.orders().findOne({ _id: orderId })
  if (!order || !['new', 'confirmed'].includes(order.status)) return order
  const dropshipItems = order.items.filter((i) => i.fulfillment === 'dropship')
  if (dropshipItems.length === 0 || !dropshipItems.every((i) => i.dropship.placed)) return order
  return collections.orders().findOneAndUpdate(
    { _id: orderId },
    {
      $set: { status: 'placed_to_dropship', updatedAt: new Date() },
      $push: {
        statusHistory: { status: 'placed_to_dropship', at: new Date(), note: 'All items placed' },
      },
    },
    { returnDocument: 'after' },
  )
}
