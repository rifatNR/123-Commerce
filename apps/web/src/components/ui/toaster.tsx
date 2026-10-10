'use client'

import { cn } from '@/lib/cn'
import { useToastStore } from '@/stores/toast-store'

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-xl px-4 py-3 text-center font-medium text-white shadow-lg',
            toast.tone === 'success' && 'bg-green-700',
            toast.tone === 'error' && 'bg-brand-700',
            toast.tone === 'info' && 'bg-stone-900',
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
