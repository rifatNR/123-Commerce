import { cn } from '@/lib/cn'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50',
  dark: 'bg-stone-900 text-white hover:bg-stone-800',
  ghost: 'text-stone-700 hover:bg-stone-100',
} as const

const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4',
  lg: 'min-h-13 px-6 text-lg',
} as const

/** Shared button classes, usable on <button> and <Link>. Large tap targets by default. */
export const buttonClass = (
  variant: keyof typeof variants = 'primary',
  size: keyof typeof sizes = 'md',
  extra?: string,
) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    extra,
  )
