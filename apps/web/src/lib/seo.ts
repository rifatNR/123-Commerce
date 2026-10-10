import type { Metadata } from 'next'
import { publicEnv } from './env'

export const absoluteUrl = (path = '/') =>
  `${publicEnv.siteUrl}${path.startsWith('/') ? path : `/${path}`}`

type PageMeta = {
  title: string
  description: string
  path: string
  image?: string
  noIndex?: boolean
}

/** Consistent title/description/canonical/OG/Twitter tags for every page. */
export const pageMetadata = ({ title, description, path, image, noIndex }: PageMeta): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title,
    description,
    url: absoluteUrl(path),
    siteName: publicEnv.siteName,
    locale: 'bn_BD',
    type: 'website',
    ...(image ? { images: [{ url: image, width: 1200, height: 1200, alt: title }] } : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    ...(image ? { images: [image] } : {}),
  },
  ...(noIndex ? { robots: { index: false, follow: false } } : {}),
})

export const truncate = (s: string, max = 160) =>
  s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
