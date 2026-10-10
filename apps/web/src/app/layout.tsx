import type { Metadata, Viewport } from 'next'
import { Hind_Siliguri } from 'next/font/google'
import Toaster from '@/components/ui/toaster'
import { publicEnv } from '@/lib/env'
import './globals.css'

// Hind Siliguri: clean, very readable Bangla on small screens, with matching Latin glyphs.
const bangla = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-bangla',
})

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${publicEnv.siteName} — বিশ্বস্ত অনলাইন কেনাকাটা`,
    template: `%s | ${publicEnv.siteName}`,
  },
  description: 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।',
  applicationName: publicEnv.siteName,
  openGraph: { siteName: publicEnv.siteName, locale: 'bn_BD', type: 'website' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#e60023',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={bangla.variable}>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
