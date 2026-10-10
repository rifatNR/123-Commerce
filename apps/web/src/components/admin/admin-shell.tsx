'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { api, refreshAccessToken } from '@/lib/browser-api'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/stores/auth-store'

const NAV = [
  { href: '/admin', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/catalog', label: 'Categories & Brands' },
]

/** Restores the session from the refresh cookie and guards every admin page. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { status, admin, clear } = useAuthStore()
  const isLogin = pathname === '/admin/login'

  useEffect(() => {
    if (status === 'unknown') void refreshAccessToken()
  }, [status])

  useEffect(() => {
    if (status === 'anonymous' && !isLogin) router.replace('/admin/login')
    if (status === 'authenticated' && isLogin) router.replace('/admin')
  }, [status, isLogin, router])

  if (isLogin)
    return <main className="grid min-h-dvh place-items-center bg-stone-100 p-4">{children}</main>
  if (status !== 'authenticated') return <p className="p-8 text-center text-stone-500">Loading…</p>

  const logout = async () => {
    await api.auth.logout.mutate().catch(() => undefined)
    clear()
  }

  return (
    <div className="min-h-dvh bg-stone-100">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2">
          <span className="mr-2 font-bold text-brand-700">123 Admin</span>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  (
                    item.href === '/admin'
                      ? pathname === '/admin' || pathname.startsWith('/admin/orders')
                      : pathname.startsWith(item.href)
                  )
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-stone-600 hover:bg-stone-100',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-stone-500 sm:inline">{admin?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  )
}
