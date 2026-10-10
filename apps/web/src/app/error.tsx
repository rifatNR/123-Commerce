'use client'

import { useEffect } from 'react'
import { buttonClass } from '@/components/ui/button-styles'
import { t } from '@/i18n/bn'
import { reportError } from '@/lib/report-error'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: 'app/error' })
  }, [error])

  return (
    <main className="container-page flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">{t.common.error}</h1>
      <button type="button" onClick={reset} className={buttonClass('primary', 'lg')}>
        {t.common.retry}
      </button>
    </main>
  )
}
