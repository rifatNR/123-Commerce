/** Public (browser-safe) config. NEXT_PUBLIC_* values are inlined at build time. */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? '123Commerce',
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, ''),
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '',
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',
  imageLoader: process.env.NEXT_PUBLIC_IMAGE_LOADER ?? '',
}
