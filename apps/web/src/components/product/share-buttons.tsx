'use client'

import { ShareIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'
import { toast } from '@/stores/toast-store'

type Props = { url: string; title: string }

export default function ShareButtons({ url, title }: Props) {
  const encoded = encodeURIComponent(url)
  const links = [
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      color: 'bg-[#1877f2]',
    },
    { name: 'Messenger', href: `fb-messenger://share/?link=${encoded}`, color: 'bg-[#0084ff]' },
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      color: 'bg-[#25d366]',
    },
  ]

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined)
    } else {
      await navigator.clipboard.writeText(url)
      toast('লিংক কপি হয়েছে', 'success')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold text-stone-700">{t.product.share}:</span>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${l.color} rounded-lg px-3 py-1.5 text-sm font-semibold text-white`}
        >
          {l.name}
        </a>
      ))}
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex items-center gap-1 rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-semibold"
        aria-label={t.product.share}
      >
        <ShareIcon className="size-4" />
      </button>
    </div>
  )
}
