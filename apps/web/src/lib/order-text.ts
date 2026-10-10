import type { OrderDto } from '@123/shared'
import { pickText } from '@123/shared'

const zoneLabel = { inside_dhaka: 'Inside Dhaka', outside_dhaka: 'Outside Dhaka' } as const

/** Plain-text order summary to paste into a supplier's form / chat. */
export const orderToText = (order: OrderDto, items = order.items) =>
  [
    `Order #${order.orderNumber}`,
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Address: ${order.customer.address}`,
    `Area: ${zoneLabel[order.deliveryZone]}`,
    order.customer.note ? `Note: ${order.customer.note}` : null,
    '',
    ...items.map((i) => {
      const opts = Object.entries(i.options)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      return `- ${pickText(i.title)}${opts ? ` (${opts})` : ''} x${i.quantity} — ${i.price * i.quantity} BDT [${i.sourceSlug}/${i.externalId}]`
    }),
    '',
    `Subtotal: ${order.subtotal} BDT`,
    `Delivery: ${order.deliveryFee} BDT`,
    `Collect (COD): ${order.total} BDT`,
  ]
    .filter((l) => l !== null)
    .join('\n')
