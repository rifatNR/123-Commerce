'use client'

import type { LocalizedText } from '@123/shared'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CartItem = {
  /** productId + chosen options, so different sizes are separate lines. */
  key: string
  productId: string
  slug: string
  title: LocalizedText
  image: string | null
  /** Display only. The server always recalculates prices. */
  price: number
  quantity: number
  options: Record<string, string>
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'key'>) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

export const MAX_QTY = 20

const itemKey = (productId: string, options: Record<string, string>) =>
  `${productId}:${Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')}`

const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n)))

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const key = itemKey(item.productId, item.options)
          const existing = state.items.find((i) => i.key === key)
          return {
            items: existing
              ? state.items.map((i) =>
                  i.key === key ? { ...i, quantity: clampQty(i.quantity + item.quantity) } : i,
                )
              : [...state.items, { ...item, key, quantity: clampQty(item.quantity) }],
          }
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: clampQty(quantity) } : i,
          ),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)

export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0)
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0)
