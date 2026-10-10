import Link from 'next/link'
import { t } from '@/i18n/bn'
import { publicEnv } from '@/lib/env'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{publicEnv.siteName}</p>
          <p className="mt-2 text-stone-600">{t.footer.about}</p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Footer">
          <Link href="/products" className="text-stone-700 hover:text-brand-700">
            {t.nav.products}
          </Link>
          <Link href="/privacy" className="text-stone-700 hover:text-brand-700">
            {t.footer.privacy}
          </Link>
          <Link href="/terms" className="text-stone-700 hover:text-brand-700">
            {t.footer.terms}
          </Link>
        </nav>
        {publicEnv.supportPhone && (
          <div>
            <p className="font-semibold">{t.footer.contact}</p>
            <a
              href={`tel:${publicEnv.supportPhone}`}
              className="mt-2 block text-lg font-semibold text-brand-700"
            >
              {publicEnv.supportPhone}
            </a>
          </div>
        )}
      </div>
      <p className="border-t border-stone-100 py-4 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} {publicEnv.siteName}. {t.footer.rights}
      </p>
    </footer>
  )
}
