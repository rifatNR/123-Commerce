'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/cn'

type Props = { images: { url: string; alt?: string }[]; title: string }

export default function ProductGallery({ images, title }: Props) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
        {current && (
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
          />
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'relative block size-16 overflow-hidden rounded-xl bg-white ring-2',
                  i === active ? 'ring-brand-600' : 'ring-stone-200',
                )}
                aria-label={`${title} ${i + 1}`}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
