import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-styles'
import { t } from '@/i18n/bn'

export default function NotFound() {
  return (
    <main className="container-page flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-black text-brand-600">৪০৪</p>
      <h1 className="text-2xl font-bold">{t.common.notFound}</h1>
      <Link href="/" className={buttonClass('primary', 'lg')}>
        {t.common.backHome}
      </Link>
    </main>
  )
}
