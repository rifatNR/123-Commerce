'use client'

import { useEffect, useRef, useState } from 'react'

type State<T> = { key: string | null; data: T | null; error: Error | null }

/**
 * Minimal data-fetching hook for the admin panel (no extra library needed).
 * Refetches whenever `deps` change (compared by value) or `reload()` is called.
 */
export const useAsync = <T>(fn: () => Promise<T>, deps: unknown[]) => {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null })
  const fnRef = useRef(fn)
  const requestKey = `${JSON.stringify(deps)}#${version}`

  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    let active = true
    fnRef.current().then(
      (data) => active && setState({ key: requestKey, data, error: null }),
      (error: Error) => active && setState((s) => ({ ...s, key: requestKey, error })),
    )
    return () => {
      active = false
    }
  }, [requestKey])

  return {
    data: state.data,
    error: state.error,
    loading: state.key !== requestKey,
    reload: () => setVersion((v) => v + 1),
    setData: (data: T) => setState((s) => ({ ...s, data })),
  }
}
