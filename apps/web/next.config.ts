import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
  transpilePackages: ['@123/shared'],
  poweredByHeader: false,
  images: {
    // Cloudflare Image Transformations do the resizing (see src/lib/image-loader.ts).
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
}

export default nextConfig

// Gives `next dev` access to local (simulated) Cloudflare bindings such as the KV namespace.
void initOpenNextCloudflareForDev()
