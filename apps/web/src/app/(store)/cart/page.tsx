import type { Metadata } from 'next'
import CartView from '@/components/cart/cart-view'
import { t } from '@/i18n/bn'
import { pageMetadata } from '@/lib/seo'
import { getStoreConfig } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = pageMetadata({
  title: t.cart.title,
  description: t.cart.title,
  path: '/cart',
  noIndex: true,
})

export default async function CartPage() {
  const config = await getStoreConfig()
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.cart.title}</h1>
      <CartView config={config} />
    </div>
  )
}
