'use client'

import type { OrderCreatedDto } from '@123/shared'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type OrderState = {
  lastOrder: (OrderCreatedDto & { customerName: string; phone: string }) | null
  setLastOrder: (order: OrderState['lastOrder']) => void
}

/** Holds the just-placed order for the confirmation page (session only, never fetched by number). */
export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (lastOrder) => set({ lastOrder }),
    }),
    { name: 'last-order', storage: createJSONStorage(() => sessionStorage) },
  ),
)
