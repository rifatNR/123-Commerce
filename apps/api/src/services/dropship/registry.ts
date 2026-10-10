import type { OrderDoc, OrderItemDoc, SourceDoc } from '../../db/types'

/**
 * Automatic order placement with supplier APIs. Right now every supplier is handled manually
 * ("Drop Shipping Process"). When a supplier offers an API, add a provider here keyed by the
 * source slug; the admin panel then shows a "Place Order to Drop Shipping" button for its items.
 */
export type DropshipProvider = {
  placeOrder: (input: {
    order: OrderDoc
    item: OrderItemDoc
    source: SourceDoc
  }) => Promise<{ supplierOrderId: string }>
}

const providers: Record<string, DropshipProvider> = {
  // 'supplier-a': supplierAProvider,
}

export const getDropshipProvider = (sourceSlug: string): DropshipProvider | undefined =>
  providers[sourceSlug]

export const autoDropshipSources = () => Object.keys(providers)
