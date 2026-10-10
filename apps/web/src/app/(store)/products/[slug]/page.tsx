import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AddToCart from '@/components/product/add-to-cart'
import ProductGallery from '@/components/product/product-gallery'
import ProductPrice from '@/components/product/product-price'
import ProductGrid from '@/components/product/product-grid'
import SectionHeading from '@/components/product/section-heading'
import ShareButtons from '@/components/product/share-buttons'
import JsonLd from '@/components/seo/json-ld'
import { buttonClass } from '@/components/ui/button-styles'
import { PhoneIcon, TruckIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'
import { publicEnv } from '@/lib/env'
import { formatNumber, text } from '@/lib/format'
import { absoluteUrl, pageMetadata, truncate } from '@/lib/seo'
import { getProductPage } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getProductPage((await params).slug)
  if (!data) return { title: t.common.notFound }
  const { product } = data
  const title = text(product.title)
  return pageMetadata({
    title,
    description: truncate(
      text(product.description) || `${title} — ক্যাশ অন ডেলিভারি সারা বাংলাদেশে।`,
    ),
    path: `/products/${product.slug}`,
    image: product.images[0]?.url,
  })
}

export default async function ProductPage({ params }: Props) {
  const data = await getProductPage((await params).slug)
  if (!data) notFound()
  const { product, brand, categories, related } = data
  const title = text(product.title)
  const url = absoluteUrl(`/products/${product.slug}`)
  const description = text(product.description)

  return (
    <div className="flex flex-col gap-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: title,
          image: product.images.map((i) => i.url),
          description: truncate(description, 500),
          sku: product.id,
          ...(brand ? { brand: { '@type': 'Brand', name: text(brand.name) } } : {}),
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'BDT',
            price: product.price,
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
        }}
      />

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <ProductGallery product={product} title={title} />

        <div className="flex flex-col gap-5">
          {categories[0] && (
            <Link
              href={`/products?category=${categories[0].slug}`}
              className="text-sm font-medium text-brand-700"
            >
              {text(categories[0].name)}
            </Link>
          )}
          <h1 className="text-2xl leading-snug font-bold sm:text-3xl">{title}</h1>
          {brand && (
            <p className="text-stone-600">
              {t.product.brand}:{' '}
              <span className="font-medium text-stone-800">{text(brand.name)}</span>
            </p>
          )}
          <ProductPrice product={product} />
          {product.deliveryDays && (
            <p className="flex items-center gap-2 text-stone-700">
              <TruckIcon className="size-5 text-brand-600" />
              {t.product.deliveryIn(
                formatNumber(product.deliveryDays.min),
                formatNumber(product.deliveryDays.max),
              )}
            </p>
          )}

          <AddToCart product={product} />

          {publicEnv.supportPhone && (
            <a href={`tel:${publicEnv.supportPhone}`} className={buttonClass('dark', 'lg')}>
              <PhoneIcon className="size-5" />
              {t.product.callToOrder}: {publicEnv.supportPhone}
            </a>
          )}
          <p className="rounded-xl bg-green-50 p-3 text-green-900">
            ✓ {t.trust.cod} — {t.trust.codSub}
          </p>
          <ShareButtons url={url} title={title} />
        </div>
      </div>

      {(description || product.attributes.length > 0) && (
        <section className="grid gap-6 md:grid-cols-2">
          {description && (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
              <h2 className="mb-3 text-xl font-bold">{t.product.description}</h2>
              <p className="leading-relaxed whitespace-pre-line text-stone-700">{description}</p>
            </div>
          )}
          {product.attributes.length > 0 && (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
              <h2 className="mb-3 text-xl font-bold">{t.product.specs}</h2>
              <dl className="divide-y divide-stone-100">
                {product.attributes.map((a) => (
                  <div key={a.name} className="flex justify-between gap-4 py-2">
                    <dt className="text-stone-600">{a.name}</dt>
                    <dd className="text-right font-medium">{a.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section>
          <SectionHeading title={t.product.related} />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
