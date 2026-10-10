'use client'

import { ORDER_STATUSES, type OrderDto, type OrderStatus } from '@123/shared'
import { TRPCClientError } from '@trpc/client'
import Link from 'next/link'
import { useState } from 'react'
import CopyButton from '@/components/ui/copy-button'
import { api } from '@/lib/browser-api'
import { formatDateTime } from '@/lib/format'
import { orderToText } from '@/lib/order-text'
import { useAsync } from '@/lib/use-async'
import { toast } from '@/stores/toast-store'
import CopyRow from './copy-row'
import OrderItemCard from './order-item-card'
import { STATUS_LABELS } from './order-status'
import StatusBadge from './status-badge'

const errorMessage = (err: unknown) =>
  err instanceof TRPCClientError ? err.message : 'Something went wrong'

export default function OrderDetail({ id }: { id: string }) {
  const { data, error, loading, setData } = useAsync(() => api.orders.get.query({ id }), [id])
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading && !data) return <p className="text-stone-500">Loading…</p>
  if (error || !data) return <p className="text-brand-700">{error?.message ?? 'Not found'}</p>

  const { order, customerOrderCount, autoDropshipSources } = data
  const update = (next: OrderDto) => setData({ ...data, order: next })

  const run = async (fn: () => Promise<OrderDto>, success: string) => {
    setBusy(true)
    try {
      update(await fn())
      toast(success, 'success')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = (status: OrderStatus) =>
    run(() => api.orders.updateStatus.mutate({ id, status }), `Marked as ${STATUS_LABELS[status]}`)

  const saveNote = async () => {
    await api.orders.updateNote
      .mutate({ id, note: note ?? '' })
      .catch((err) => toast(errorMessage(err), 'error'))
    toast('Note saved', 'success')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-sm text-stone-500 hover:underline">
          ← Orders
        </Link>
        <h1 className="font-mono text-2xl font-bold">#{order.orderNumber}</h1>
        <CopyButton value={order.orderNumber} />
        <StatusBadge status={order.status} />
        <span className="text-sm text-stone-500">{formatDateTime(order.createdAt)}</span>
        <div className="ml-auto">
          <CopyButton
            value={orderToText(order)}
            label="Copy all details"
            className="bg-white ring-1 ring-stone-200"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="mb-2 font-bold">Customer</h2>
            <dl className="divide-y divide-stone-100">
              <CopyRow label="Name" value={order.customer.name} />
              <CopyRow label="Phone" value={order.customer.phone} />
              <CopyRow label="Address" value={order.customer.address} />
              <CopyRow
                label="Area"
                value={order.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
              />
              <CopyRow label="Note" value={order.customer.note} />
              <CopyRow label="Orders" value={`${customerOrderCount} order(s) from this phone`} />
            </dl>
            <a
              href={`tel:${order.customer.phone}`}
              className="mt-3 inline-block rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
            >
              Call customer
            </a>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-bold">Items</h2>
            {order.items.map((item, index) => (
              <OrderItemCard
                key={index}
                order={order}
                item={item}
                busy={busy}
                canAutoPlace={autoDropshipSources.includes(item.sourceSlug)}
                onMark={(placed, supplierOrderId) =>
                  run(
                    () =>
                      api.orders.markItemDropship.mutate({
                        id,
                        itemIndex: index,
                        placed,
                        supplierOrderId,
                      }),
                    placed ? 'Marked as placed' : 'Unmarked',
                  )
                }
                onAutoPlace={() =>
                  run(
                    () => api.orders.placeItemToDropship.mutate({ id, itemIndex: index }),
                    'Placed with supplier',
                  )
                }
              />
            ))}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="mb-2 font-bold">Payment (COD)</h2>
            <dl className="divide-y divide-stone-100">
              <CopyRow label="Subtotal" value={order.subtotal} />
              <CopyRow label="Delivery" value={order.deliveryFee} />
              <CopyRow label="Collect" value={order.total} />
            </dl>
          </section>

          <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="mb-2 font-bold">Status</h2>
            <select
              value={order.status}
              disabled={busy}
              onChange={(e) => void changeStatus(e.target.value as OrderStatus)}
              className="h-10 w-full rounded-lg border border-stone-300 bg-white px-2"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {order.status !== 'placed_to_dropship' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void changeStatus('placed_to_dropship')}
                className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
              >
                Mark as “Placed To Drop Shipping”
              </button>
            )}
            <ol className="mt-3 flex flex-col gap-1 text-sm text-stone-600">
              {order.statusHistory.map((h, i) => (
                <li key={i}>
                  {formatDateTime(h.at)} — {STATUS_LABELS[h.status]}
                  {h.note ? ` (${h.note})` : ''}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="mb-2 font-bold">Internal note</h2>
            <textarea
              value={note ?? order.adminNote ?? ''}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-stone-300 p-2"
            />
            <button
              type="button"
              onClick={saveNote}
              className="mt-2 rounded-lg bg-stone-900 px-3 py-1.5 text-sm text-white"
            >
              Save note
            </button>
          </section>

          <section className="rounded-xl bg-white p-4 text-sm ring-1 ring-stone-200">
            <h2 className="mb-2 font-bold">Source / tracking</h2>
            <dl className="divide-y divide-stone-100">
              {Object.entries(order.attribution).map(([k, v]) => (
                <CopyRow key={k} label={k} value={v} />
              ))}
              <CopyRow label="IP" value={order.ip} />
              <CopyRow label="Visitor" value={order.visitorId} />
              <CopyRow label="Device" value={order.userAgent} />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}
