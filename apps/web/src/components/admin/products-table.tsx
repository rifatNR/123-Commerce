'use client'

import { pickText, type ProductDto } from '@123/shared'
import Image from 'next/image'
import { useState } from 'react'
import { api } from '@/lib/browser-api'
import { useAsync } from '@/lib/use-async'
import { toast } from '@/stores/toast-store'
import Toggle from './toggle'

const LIMIT = 50

export default function ProductsTable() {
  const [sourceSlug, setSourceSlug] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const sources = useAsync(() => api.sources.list.query(), [])
  const products = useAsync(
    () =>
      api.products.list.query({
        sourceSlug: sourceSlug || undefined,
        q: search || undefined,
        page,
        limit: LIMIT,
      }),
    [sourceSlug, search, page],
  )
  const totalPages = products.data ? Math.ceil(products.data.total / LIMIT) : 1

  const setFlag = async (product: ProductDto, flag: 'visible' | 'featured', value: boolean) => {
    try {
      await api.products.setFlags.mutate({ ids: [product.id], [flag]: value })
      if (products.data) {
        products.setData({
          ...products.data,
          items: products.data.items.map((p) =>
            p.id === product.id ? { ...p, [flag]: value } : p,
          ),
        })
      }
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const setAllVisible = async (visible: boolean) => {
    const ids = products.data?.items.map((p) => p.id) ?? []
    if (ids.length === 0) return
    await api.products.setFlags.mutate({ ids, visible })
    toast(`${ids.length} products ${visible ? 'shown' : 'hidden'}`, 'success')
    void products.reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">
          Products{' '}
          {products.data && <span className="text-stone-400">({products.data.total})</span>}
        </h1>
        <select
          value={sourceSlug}
          onChange={(e) => {
            setSourceSlug(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-lg border border-stone-300 bg-white px-2"
        >
          <option value="">All sources</option>
          {sources.data?.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name} ({s.productCount}){s.active ? '' : ' — inactive'}
            </option>
          ))}
        </select>
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
            placeholder="Search title"
            className="h-10 rounded-lg border border-stone-300 bg-white px-3"
          />
          <button type="submit" className="rounded-lg bg-stone-900 px-4 text-white">
            Search
          </button>
        </form>
      </div>
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setAllVisible(true)}
          className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-stone-200"
        >
          Show all on this page
        </button>
        <button
          type="button"
          onClick={() => setAllVisible(false)}
          className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-stone-200"
        >
          Hide all on this page
        </button>
      </div>

      {products.error && <p className="text-brand-700">{products.error.message}</p>}
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Source</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Cost</th>
              <th className="p-3">Visible</th>
              <th className="p-3">Featured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.data?.items.map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded bg-stone-100">
                      {p.images[0] && (
                        <Image
                          src={p.images[0].url}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <a
                      href={`/products/${p.slug}`}
                      target="_blank"
                      className="line-clamp-2 hover:underline"
                    >
                      {pickText(p.title)}
                    </a>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap text-stone-600">
                  {p.sourceSlug}
                  <br />
                  <span className="text-xs text-stone-400">{p.externalId}</span>
                </td>
                <td className="p-3 text-right">৳{p.price}</td>
                <td className="p-3 text-right text-stone-500">
                  {p.costPrice !== undefined ? `৳${p.costPrice}` : '—'}
                </td>
                <td className="p-3">
                  <Toggle
                    checked={p.visible}
                    onChange={(v) => setFlag(p, 'visible', v)}
                    label="Visible"
                  />
                </td>
                <td className="p-3">
                  <Toggle
                    checked={p.featured}
                    onChange={(v) => setFlag(p, 'featured', v)}
                    label="Featured"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.data?.items.length === 0 && (
          <p className="p-8 text-center text-stone-500">
            No products. Import them with your script.
          </p>
        )}
      </div>

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
