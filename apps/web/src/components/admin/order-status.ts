import type { OrderStatus } from '@123/shared'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed (called)',
  placed_to_dropship: 'Placed To Drop Shipping',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-brand-100 text-brand-800',
  confirmed: 'bg-amber-100 text-amber-800',
  placed_to_dropship: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-stone-200 text-stone-700',
  returned: 'bg-stone-200 text-stone-700',
}
