import Link from 'next/link'
import CategoryNav from '@/components/layout/category-nav'
import TrustBadges from '@/components/layout/trust-badges'
import ProductGrid from '@/components/product/product-grid'
import SectionHeading from '@/components/product/section-heading'
import { buttonClass } from '@/components/ui/button-styles'
import { t } from '@/i18n/bn'
import { getCatalog, getHome } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [home, catalog] = await Promise.all([getHome(), getCatalog()])

  return (
    <div className="flex flex-col gap-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-white sm:px-10 sm:py-14">
        <h1 className="max-w-xl text-3xl leading-tight font-bold sm:text-4xl">
          {t.home.heroTitle}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-white/90">{t.home.heroText}</p>
        <Link href="/products" className={buttonClass('secondary', 'lg', 'mt-6 ring-0')}>
          {t.home.heroCta}
        </Link>
      </section>

      <TrustBadges />
      <CategoryNav categories={catalog.categories} />

      {home.featured.length > 0 && (
        <section>
          <SectionHeading title={t.home.featured} />
          <ProductGrid products={home.featured} priorityCount={2} />
        </section>
      )}

      <section>
        <SectionHeading title={t.home.latest} href="/products" linkLabel={t.home.seeAll} />
        {home.latest.length > 0 ? (
          <ProductGrid products={home.latest} priorityCount={home.featured.length ? 0 : 2} />
        ) : (
          <p className="rounded-2xl bg-white p-8 text-center text-stone-500 ring-1 ring-stone-200">
            {t.list.empty}
          </p>
        )}
      </section>
    </div>
  )
}
