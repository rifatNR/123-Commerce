'use client'

import { pickText, type OrderDto, type OrderItemDto } from '@123/shared'
import Image from 'next/image'
import { useState } from 'react'
import CopyButton from '@/components/ui/copy-button'
import { formatDateTime } from '@/lib/format'
import { orderToText } from '@/lib/order-text'

type Props = {
  order: OrderDto
  item: OrderItemDto
  busy: boolean
  canAutoPlace: boolean
  onMark: (placed: boolean, supplierOrderId?: string) => void
  onAutoPlace: () => void
}

export default function OrderItemCard({
  order,
  item,
  busy,
  canAutoPlace,
  onMark,
  onAutoPlace,
}: Props) {
  const [supplierOrderId, setSupplierOrderId] = useState('')
  const title = pickText(item.title)
  const options = Object.entries(item.options)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
          {item.image && (
            <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <a
              href={`/products/${item.slug}`}
              target="_blank"
              className="font-medium hover:underline"
            >
              {title}
            </a>
            <CopyButton value={title} />
          </div>
          {options && <p className="text-sm text-stone-600">{options}</p>}
          <p className="text-sm">
            ৳{item.price} × {item.quantity} = <strong>৳{item.price * item.quantity}</strong>
            {item.costPrice !== null && (
              <span className="text-stone-500"> · cost ৳{item.costPrice * item.quantity}</span>
            )}
          </p>
          <p className="flex items-center gap-1 text-sm text-stone-500">
            Source: {item.sourceSlug} / {item.externalId}
            <CopyButton value={item.externalId} />
          </p>
        </div>
      </div>

      {item.fulfillment === 'dropship' && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
          {item.dropship.placed ? (
            <>
              <span className="rounded-md bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
                Placed {item.dropship.placedAt ? formatDateTime(item.dropship.placedAt) : ''}
                {item.dropship.supplierOrderId ? ` · #${item.dropship.supplierOrderId}` : ''}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => onMark(false)}
                className="text-sm text-stone-500 underline"
              >
                Undo
              </button>
            </>
          ) : (
            <>
              <CopyButton
                value={orderToText(order, [item])}
                label="Copy for supplier"
                className="ring-1 ring-stone-200"
              />
              <input
                value={supplierOrderId}
                onChange={(e) => setSupplierOrderId(e.target.value)}
                placeholder="Supplier order id (optional)"
                className="h-9 rounded-lg border border-stone-300 px-2 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => onMark(true, supplierOrderId || undefined)}
                className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Mark placed
              </button>
              {canAutoPlace && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onAutoPlace}
                  className="h-9 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Place Order to Drop Shipping
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
