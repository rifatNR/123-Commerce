import type {
  CustomerInfo,
  DeliveryZone,
  FulfillmentType,
  LocalizedText,
  OrderStatus,
  ProductVariant,
  SourceType,
} from '@123/shared'
import type { ObjectId } from 'mongodb'
import type { DeviceInfo } from '../lib/user-agent'

type Timestamps = { createdAt: Date; updatedAt: Date }

export type ProductDoc = Timestamps & {
  _id: ObjectId
  slug: string
  sourceSlug: string
  externalId: string
  title: LocalizedText
  description?: LocalizedText
  images: { url: string; alt?: string }[]
  /** Missing on docs stored before schema v2. */
  videos?: { url: string; poster?: string }[]
  price: number
  compareAtPrice?: number
  costPrice?: number
  stock?: number | null
  brandSlug: string | null
  categorySlugs: string[]
  options: { name: string; values: string[] }[]
  /** Missing on docs stored before schema v2. */
  variants?: ProductVariant[]
  attributes: { name: string; value: string }[]
  tags: string[]
  fulfillment: FulfillmentType
  deliveryDays?: { min: number; max: number }
  visible: boolean
  featured: boolean
  meta?: Record<string, unknown>
  schemaVersion: number
}

export type SourceDoc = Timestamps & {
  _id: ObjectId
  slug: string
  name: string
  type: SourceType
  website?: string
  contact?: string
  notes?: string
  active: boolean
  config?: Record<string, unknown>
}

/** Stored in a per-source collection (`src_<slug>`), untouched source data. */
export type SourceProductDoc = {
  _id: ObjectId
  externalId: string
  raw: Record<string, unknown> | null
  hash: string
  productId: ObjectId | null
  syncedAt: Date
  createdAt: Date
}

export type CatalogDoc = Timestamps & {
  _id: ObjectId
  slug: string
  name: LocalizedText
  image: string | null
  visible: boolean
  sortOrder: number
}

export type OrderItemDoc = {
  productId: ObjectId
  slug: string
  title: LocalizedText
  image: string | null
  price: number
  costPrice: number | null
  quantity: number
  options: Record<string, string>
  /** Missing on orders placed before variants existed. */
  variantSku?: string | null
  sourceSlug: string
  externalId: string
  fulfillment: FulfillmentType
  dropship: { placed: boolean; placedAt: Date | null; supplierOrderId: string | null }
}

export type OrderDoc = Timestamps & {
  _id: ObjectId
  orderNumber: string
  status: OrderStatus
  customer: CustomerInfo
  items: OrderItemDoc[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryZone: DeliveryZone
  visitorId: string | null
  attribution: Record<string, string>
  ip: string | null
  userAgent: string | null
  device: DeviceInfo
  adminNote: string | null
  statusHistory: { status: OrderStatus; at: Date; note: string | null }[]
}

export type CustomerDoc = {
  _id: ObjectId
  phone: string
  name: string
  addresses: string[]
  visitorIds: string[]
  orderCount: number
  totalSpent: number
  firstOrderAt: Date
  lastOrderAt: Date
}

export type VisitTouch = {
  at: Date
  path: string
  referrer: string | null
  params: Record<string, string>
  ip: string | null
}

export type VisitorDoc = {
  _id: ObjectId
  visitorId: string
  firstSeenAt: Date
  lastSeenAt: Date
  visits: number
  ips: string[]
  userAgent: string | null
  device: DeviceInfo
  language: string | null
  screen: { w: number; h: number } | null
  firstTouch: VisitTouch
  /** Most recent sessions, capped. */
  sessions: VisitTouch[]
}

export type AdminDoc = {
  _id: ObjectId
  email: string
  name: string
  passwordHash: string
  createdAt: Date
  lastLoginAt: Date | null
}

export type RefreshTokenDoc = {
  _id: ObjectId
  tokenHash: string
  adminId: ObjectId
  /** All tokens rotated from the same login share a family; reuse of an old one revokes the family. */
  family: string
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
}

export type ClientLogDoc = {
  _id: ObjectId
  level: 'error' | 'warn' | 'info'
  message: string
  stack?: string
  path?: string
  visitorId?: string
  context?: Record<string, unknown>
  ip: string | null
  userAgent: string | null
  createdAt: Date
}

export type CounterDoc = { _id: string; seq: number }
