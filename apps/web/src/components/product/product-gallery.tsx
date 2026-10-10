'use client'

import type { PublicProduct } from '@123/shared'
import Image from 'next/image'
import { useState } from 'react'
import { PlayIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'
import { cn } from '@/lib/cn'
import { selectedVariant } from '@/lib/variants'
import { useSelectedOptions } from '@/stores/product-selection-store'

type Media =
  { kind: 'image'; url: string; alt?: string } | { kind: 'video'; url: string; poster?: string }

type Props = { product: PublicProduct; title: string }

/** Images, then videos. Picking a variant with its own image jumps to that image. */
export default function ProductGallery({ product, title }: Props) {
  const variantImage = selectedVariant(product, useSelectedOptions(product.id))?.image ?? null
  const images: Media[] = product.images.map((i) => ({ kind: 'image', ...i }))
  // A variant image that isn't already in the gallery goes first.
  if (variantImage && !images.some((m) => m.url === variantImage))
    images.unshift({ kind: 'image', url: variantImage })
  const media: Media[] = [
    ...images,
    ...product.videos.map((v) => ({ kind: 'video' as const, ...v })),
  ]

  const [active, setActive] = useState(0)
  const [shownVariantImage, setShownVariantImage] = useState(variantImage)
  // Adjust state during render when the variant changes (no effect needed).
  if (variantImage !== shownVariantImage) {
    setShownVariantImage(variantImage)
    if (variantImage) setActive(media.findIndex((m) => m.url === variantImage))
  }
  const current = media[active] ?? media[0]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
        {current?.kind === 'image' && (
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
          />
        )}
        {current?.kind === 'video' && (
          <video
            key={current.url}
            src={current.url}
            poster={current.poster}
            controls
            playsInline
            preload="metadata"
            className="size-full bg-black object-contain"
          />
        )}
      </div>
      {media.length > 1 && (
        <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto p-1">
          {media.map((m, i) => (
            <li key={m.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'relative flex size-16 items-center justify-center overflow-hidden rounded-xl bg-stone-900 ring-2',
                  i === active ? 'ring-brand-600' : 'ring-stone-200',
                  m.kind === 'image' && 'bg-white',
                )}
                aria-label={
                  m.kind === 'video' ? `${t.product.video} ${i + 1}` : `${title} ${i + 1}`
                }
              >
                {m.kind === 'image' && (
                  <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
                )}
                {m.kind === 'video' && m.poster && (
                  <Image
                    src={m.poster}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover opacity-70"
                  />
                )}
                {m.kind === 'video' && <PlayIcon className="relative size-7 text-white" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
