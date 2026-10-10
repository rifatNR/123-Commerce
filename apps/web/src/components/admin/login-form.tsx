'use client'

import { TRPCClientError } from '@trpc/client'
import { useState, type FormEvent } from 'react'
import { buttonClass } from '@/components/ui/button-styles'
import { publicApi } from '@/lib/browser-api'
import { useAuthStore } from '@/stores/auth-store'

export default function LoginForm() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setLoading(true)
    setError(null)
    try {
      setAuth(
        await publicApi.auth.login.mutate({
          email: String(form.get('email')),
          password: String(form.get('password')),
        }),
      )
    } catch (err) {
      setError(err instanceof TRPCClientError ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  const input =
    'h-11 w-full rounded-xl border border-stone-300 px-3 outline-none focus:border-brand-500'
  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      <h1 className="text-xl font-bold">Admin login</h1>
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        autoComplete="username"
        className={input}
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Password"
        autoComplete="current-password"
        className={input}
      />
      {error && <p className="text-sm text-brand-700">{error}</p>}
      <button type="submit" disabled={loading} className={buttonClass()}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
