'use client'

import { pickText, type CatalogKind } from '@123/shared'
import { useState } from 'react'
import { api } from '@/lib/browser-api'
import { cn } from '@/lib/cn'
import { useAsync } from '@/lib/use-async'
import { toast } from '@/stores/toast-store'
import Toggle from './toggle'

/** Show/hide whole categories or brands, and set their display order. */
export default function CatalogTable() {
  const [kind, setKind] = useState<CatalogKind>('category')
  const list = useAsync(() => api.catalog.list.query({ kind }), [kind])

  const update = async (slug: string, patch: { visible?: boolean; sortOrder?: number }) => {
    try {
      await api.catalog.update.mutate({ kind, slug, ...patch })
      if (list.data) list.setData(list.data.map((c) => (c.slug === slug ? { ...c, ...patch } : c)))
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Categories & Brands</h1>
        {(['category', 'brand'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium',
              kind === k ? 'bg-stone-900 text-white' : 'bg-white ring-1 ring-stone-200',
            )}
          >
            {k === 'category' ? 'Categories' : 'Brands'}
          </button>
        ))}
      </div>
      <p className="text-sm text-stone-600">
        Hidden {kind === 'category' ? 'categories' : 'brands'} hide all of their products from the
        store.
      </p>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3 text-right">Products</th>
              <th className="p-3">Order</th>
              <th className="p-3">Visible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.data?.map((c) => (
              <tr key={c.slug}>
                <td className="p-3 font-medium">{pickText(c.name)}</td>
                <td className="p-3 text-stone-500">{c.slug}</td>
                <td className="p-3 text-right">{c.productCount ?? 0}</td>
                <td className="p-3">
                  <input
                    type="number"
                    defaultValue={c.sortOrder}
                    onBlur={(e) =>
                      Number(e.target.value) !== c.sortOrder &&
                      update(c.slug, { sortOrder: Number(e.target.value) })
                    }
                    className="h-8 w-20 rounded border border-stone-300 px-2"
                  />
                </td>
                <td className="p-3">
                  <Toggle
                    checked={c.visible}
                    onChange={(visible) => update(c.slug, { visible })}
                    label="Visible"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data?.length === 0 && (
          <p className="p-8 text-center text-stone-500">
            Nothing yet. They are created automatically when products are imported.
          </p>
        )}
      </div>
    </div>
  )
}
