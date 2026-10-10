'use client'

import type { AdminDto, AuthResult } from '@123/shared'
import { create } from 'zustand'

type AuthState = {
  /** Kept in memory only. The refresh token lives in an httpOnly cookie set by the API. */
  accessToken: string | null
  admin: AdminDto | null
  status: 'unknown' | 'authenticated' | 'anonymous'
  setAuth: (result: AuthResult) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  admin: null,
  status: 'unknown',
  setAuth: (result) =>
    set({ accessToken: result.accessToken, admin: result.admin, status: 'authenticated' }),
  clear: () => set({ accessToken: null, admin: null, status: 'anonymous' }),
}))
