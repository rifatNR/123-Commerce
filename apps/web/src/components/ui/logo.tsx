import Link from 'next/link'
import { publicEnv } from '@/lib/env'

/** Placeholder text logo ("123Commerce Logo") until the real brand is decided. */
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label={publicEnv.siteName}>
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
        123
      </span>
      <span className="text-lg font-bold tracking-tight text-stone-900">
        {publicEnv.siteName.replace(/^123/, '')}
      </span>
    </Link>
  )
}
