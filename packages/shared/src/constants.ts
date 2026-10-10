export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'placed_to_dropship',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const FULFILLMENT_TYPES = ['dropship', 'self'] as const
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number]

export const SOURCE_TYPES = ['dropship', 'own'] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export const DELIVERY_ZONES = ['inside_dhaka', 'outside_dhaka'] as const
export type DeliveryZone = (typeof DELIVERY_ZONES)[number]

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc'] as const
export type ProductSort = (typeof PRODUCT_SORTS)[number]

/** Bump when the stored product document shape changes, so old docs can be migrated lazily. */
export const PRODUCT_SCHEMA_VERSION = 2

export const PAGE_SIZE = 24
export const IMPORT_BATCH_MAX = 200
