import type { Metadata } from 'next'
import OrderConfirmation from '@/components/cart/order-confirmation'
import { t } from '@/i18n/bn'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: t.confirmation.title,
  description: t.confirmation.title,
  path: '/order/success',
  noIndex: true,
})

export default function OrderSuccessPage() {
  return <OrderConfirmation />
}
