'use client'

import { create } from 'zustand'

type SelectionState = {
  /** Which product the selection belongs to, so it resets when another product opens. */
  productId: string | null
  options: Record<string, string>
  setOptions: (productId: string, options: Record<string, string>) => void
}

/** Options picked on the product page. Shared by the gallery, price and add-to-cart. */
export const useSelectionStore = create<SelectionState>()((set) => ({
  productId: null,
  options: {},
  setOptions: (productId, options) => set({ productId, options }),
}))

const empty: Record<string, string> = {}

export const useSelectedOptions = (productId: string) =>
  useSelectionStore((s) => (s.productId === productId ? s.options : empty))
