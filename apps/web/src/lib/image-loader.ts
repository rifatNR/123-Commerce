'use client'

import type { ImageLoaderProps } from 'next/image'

/**
 * With NEXT_PUBLIC_IMAGE_LOADER=cloudflare, images are resized and converted to WebP/AVIF by
 * Cloudflare Image Transformations (enable it on your zone). Otherwise the original is served.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (process.env.NEXT_PUBLIC_IMAGE_LOADER !== 'cloudflare' || src.startsWith('data:')) return src
  const params = [`width=${width}`, `quality=${quality ?? 75}`, 'format=auto', 'fit=scale-down']
  return `/cdn-cgi/image/${params.join(',')}/${src}`
}
