import Link from 'next/link'
import { ChevronIcon } from '@/components/ui/icons'

type Props = { title: string; href?: string; linkLabel?: string }

export default function SectionHeading({ title, href, linkLabel }: Props) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="flex items-center font-medium text-brand-700 hover:underline">
          {linkLabel}
          <ChevronIcon className="size-4" />
        </Link>
      )}
    </div>
  )
}
