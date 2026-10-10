'use client'

import { ORDER_STATUSES, pickText, type OrderStatus } from '@123/shared'
import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/lib/browser-api'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { useAsync } from '@/lib/use-async'
import { STATUS_LABELS } from './order-status'
import StatusBadge from './status-badge'

export default function OrdersList() {
  const [status, setStatus] = useState<OrderStatus | undefined>('new')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const counts = useAsync(() => api.orders.counts.query(), [])
  const orders = useAsync(
    () => api.orders.list.query({ status, q: search || undefined, page }),
    [status, search, page],
  )
  const totalPages = orders.data ? Math.ceil(orders.data.total / orders.data.limit) : 1

  const tab = (value: OrderStatus | undefined, label: string, count?: number) => (
    <button
      key={label}
      type="button"
      onClick={() => {
        setStatus(value)
        setPage(1)
      }}
      className={cn(
        'shrink-0 rounded-lg px-3 py-2 text-sm font-medium',
        status === value
          ? 'bg-stone-900 text-white'
          : 'bg-white text-stone-700 ring-1 ring-stone-200',
      )}
    >
      {label}
      {count ? ` (${count})` : ''}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(q.trim())
            setPage(1)
          }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order no, phone or name"
            className="h-10 rounded-lg border border-stone-300 bg-white px-3"
          />
          <button type="submit" className="rounded-lg bg-stone-900 px-4 text-white">
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tab(undefined, 'All')}
        {ORDER_STATUSES.map((s) => tab(s, STATUS_LABELS[s], counts.data?.[s]))}
      </div>

      {orders.error && <p className="text-brand-700">{orders.error.message}</p>}
      {orders.loading && !orders.data && <p className="text-stone-500">Loading…</p>}

      <ul className="flex flex-col gap-2">
        {orders.data?.items.map((order) => (
          <li key={order.id}>
            <Link
              href={`/admin/orders/${order.id}`}
              className="flex flex-col gap-2 rounded-xl bg-white p-4 ring-1 ring-stone-200 hover:ring-brand-300 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 sm:w-56">
                <span className="font-mono font-bold">#{order.orderNumber}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {order.customer.name} · {order.customer.phone}
                </p>
                <p className="truncate text-sm text-stone-600">
                  {order.items.map((i) => `${pickText(i.title)} ×${i.quantity}`).join(', ')}
                </p>
              </div>
              <div className="text-sm sm:text-right">
                <p className="font-bold">৳{order.total}</p>
                <p className="text-stone-500">{formatDateTime(order.createdAt)}</p>
              </div>
            </Link>
          </li>
        ))}
        {orders.data?.items.length === 0 && (
          <p className="p-8 text-center text-stone-500">No orders.</p>
        )}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg bg-white px-3 py-2 ring-1 ring-stone-200 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-white px-3 py-2 ring-1 ring-stone-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
