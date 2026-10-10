import { z } from 'zod'
import {
  DELIVERY_ZONES,
  ORDER_STATUSES,
  type DeliveryZone,
  type FulfillmentType,
  type OrderStatus,
} from '../constants'
import { normalizeBdPhone } from '../utils/phone'
import { objectIdSchema, type LocalizedText } from './common'

export const customerInfoSchema = z.object({
  name: z.string().trim().min(2, 'নাম লিখুন').max(100),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const phone = normalizeBdPhone(v)
      if (!phone) ctx.addIssue({ code: 'custom', message: 'সঠিক মোবাইল নম্বর দিন' })
      return phone ?? v
    }),
  address: z.string().trim().min(8, 'পূর্ণ ঠিকানা লিখুন').max(500),
  deliveryZone: z.enum(DELIVERY_ZONES),
  note: z.string().trim().max(500).optional(),
})
export type CustomerInfo = z.infer<typeof customerInfoSchema>

export const orderCreateSchema = z.object({
  customer: customerInfoSchema,
  items: z
    .array(
      z.object({
        productId: objectIdSchema,
        quantity: z.number().int().min(1).max(20),
        options: z.record(z.string(), z.string()).default({}),
      }),
    )
    .min(1)
    .max(30),
  visitorId: z.string().max(64).optional(),
  attribution: z.record(z.string(), z.string().max(500)).optional(),
})
export type OrderCreateInput = z.infer<typeof orderCreateSchema>

export const orderListSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(30),
})

export const orderStatusUpdateSchema = z.object({
  id: objectIdSchema,
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(1000).optional(),
})

export const orderItemDropshipSchema = z.object({
  id: objectIdSchema,
  itemIndex: z.number().int().min(0),
  placed: z.boolean(),
  supplierOrderId: z.string().max(200).optional(),
})

export type OrderItemDto = {
  productId: string
  slug: string
  title: LocalizedText
  image: string | null
  price: number
  costPrice: number | null
  quantity: number
  options: Record<string, string>
  /** The chosen variant's SKU at the source, for placing the dropship order. */
  variantSku: string | null
  sourceSlug: string
  externalId: string
  fulfillment: FulfillmentType
  dropship: { placed: boolean; placedAt: string | null; supplierOrderId: string | null }
}

export type OrderDto = {
  id: string
  orderNumber: string
  status: OrderStatus
  customer: CustomerInfo
  items: OrderItemDto[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryZone: DeliveryZone
  visitorId: string | null
  attribution: Record<string, string>
  ip: string | null
  userAgent: string | null
  adminNote: string | null
  statusHistory: { status: OrderStatus; at: string; note: string | null }[]
  createdAt: string
  updatedAt: string
}

export type OrderCreatedDto = Pick<
  OrderDto,
  'orderNumber' | 'subtotal' | 'deliveryFee' | 'total'
> & {
  items: { title: LocalizedText; quantity: number; price: number }[]
}
