import OrderDetail from '@/components/admin/order-detail'

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  return <OrderDetail id={(await params).id} />
}
