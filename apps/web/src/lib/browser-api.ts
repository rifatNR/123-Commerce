'use client'

import type { AppRouter } from '@123/api/router'
import { createTRPCClient, httpLink } from '@trpc/client'
import { useAuthStore } from '@/stores/auth-store'
import { publicEnv } from './env'

const url = `${publicEnv.apiUrl}/trpc`

/** Used only for the refresh call so it never recurses into the retry logic below. */
const bareClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({ url, fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }) }),
  ],
})

let refreshing: Promise<boolean> | null = null

/** Exchanges the httpOnly refresh cookie for a new access token. Concurrent calls share one request. */
export const refreshAccessToken = () => {
  refreshing ??= bareClient.auth.refresh
    .mutate()
    .then((result) => {
      useAuthStore.getState().setAuth(result)
      return true
    })
    .catch(() => {
      useAuthStore.getState().clear()
      return false
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const send = () => {
    const headers = new Headers(init?.headers)
    const token = useAuthStore.getState().accessToken
    if (token) headers.set('authorization', `Bearer ${token}`)
    return fetch(input, { ...init, headers, credentials: 'include' })
  }
  const res = await send()
  if (res.status !== 401 || !useAuthStore.getState().accessToken) return res
  return (await refreshAccessToken()) ? send() : res
}

/** tRPC client for the browser: placing orders, tracking, and the admin panel. */
export const api = createTRPCClient<AppRouter>({ links: [httpLink({ url, fetch: authFetch })] })
export { bareClient as publicApi }
