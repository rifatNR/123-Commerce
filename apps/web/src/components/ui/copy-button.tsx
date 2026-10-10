'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { CheckIcon, CopyIcon } from './icons'

type Props = { value: string; label?: string; className?: string }

/** Copies a value to the clipboard (used heavily in the admin order view). */
export default function CopyButton({ value, label, className }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Older browsers / insecure context fallback.
      const el = document.createElement('textarea')
      el.value = value
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label ?? 'Copy'}
      aria-label={label ?? 'Copy'}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900',
        copied && 'text-green-600',
        className,
      )}
    >
      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      {label && <span className="text-sm">{label}</span>}
    </button>
  )
}
