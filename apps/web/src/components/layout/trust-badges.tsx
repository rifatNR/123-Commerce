import { CashIcon, PhoneIcon, TruckIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'

const badges = [
  { Icon: CashIcon, title: t.trust.cod, sub: t.trust.codSub },
  { Icon: TruckIcon, title: t.trust.delivery, sub: t.trust.deliverySub },
  { Icon: PhoneIcon, title: t.trust.support, sub: t.trust.supportSub },
]

export default function TrustBadges() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {badges.map(({ Icon, title, sub }) => (
        <li
          key={title}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="size-6" />
          </span>
          <span>
            <span className="block font-semibold">{title}</span>
            <span className="block text-sm text-stone-600">{sub}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
