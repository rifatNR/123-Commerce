'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => undefined

/** False during SSR and the first client render; avoids hydration mismatches for localStorage data. */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
