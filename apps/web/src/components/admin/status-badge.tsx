import type { OrderStatus } from '@123/shared'
import { cn } from '@/lib/cn'
import { STATUS_COLORS, STATUS_LABELS } from './order-status'

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        STATUS_COLORS[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
