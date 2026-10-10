import type { OrderDto } from '@123/shared'
import type { OrderDoc } from '../db/types'

export const toOrderDto = (doc: OrderDoc): OrderDto => ({
  id: doc._id.toHexString(),
  orderNumber: doc.orderNumber,
  status: doc.status,
  customer: doc.customer,
  items: doc.items.map((item) => ({
    ...item,
    productId: item.productId.toHexString(),
    dropship: {
      placed: item.dropship.placed,
      placedAt: item.dropship.placedAt?.toISOString() ?? null,
      supplierOrderId: item.dropship.supplierOrderId,
    },
  })),
  subtotal: doc.subtotal,
  deliveryFee: doc.deliveryFee,
  total: doc.total,
  deliveryZone: doc.deliveryZone,
  visitorId: doc.visitorId,
  attribution: doc.attribution,
  ip: doc.ip,
  userAgent: doc.userAgent,
  adminNote: doc.adminNote,
  statusHistory: doc.statusHistory.map((h) => ({ ...h, at: h.at.toISOString() })),
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
})
