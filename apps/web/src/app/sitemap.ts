import type { MetadataRoute } from 'next'
import { logger } from '@/lib/logger'
import { absoluteUrl } from '@/lib/seo'
import { getSitemap } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/products'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/terms'), changeFrequency: 'yearly', priority: 0.2 },
  ]
  try {
    const data = await getSitemap()
    return [
      ...pages,
      ...data.categories.map((slug) => ({
        url: absoluteUrl(`/products?category=${slug}`),
        priority: 0.7,
      })),
      ...data.products.map((p) => ({
        url: absoluteUrl(`/products/${p.slug}`),
        lastModified: p.updatedAt,
        priority: 0.8,
      })),
    ]
  } catch (err) {
    logger.error('sitemap failed', { err })
    return pages
  }
}
