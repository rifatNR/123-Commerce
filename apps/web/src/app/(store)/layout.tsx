import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import JsonLd from '@/components/seo/json-ld'
import MetaPixel from '@/components/tracking/meta-pixel'
import VisitorTracker from '@/components/tracking/visitor-tracker'
import { publicEnv } from '@/lib/env'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="container-page py-5">{children}</main>
      <Footer />
      <VisitorTracker />
      <MetaPixel />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: publicEnv.siteName,
          url: publicEnv.siteUrl,
          ...(publicEnv.supportPhone ? { telephone: publicEnv.supportPhone } : {}),
        }}
      />
    </>
  )
}
