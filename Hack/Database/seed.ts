/**
 * Demo data for local development only. Safe to run again (upserts by externalId).
 *   ./Hack/Database/seed.sh
 *
 * Lives outside apps/api, so it imports the API's code by relative path.
 * Only relative imports here: bare packages (mongodb, ...) don't resolve from this folder.
 */
import { collections } from '../../apps/api/src/db/collections'
import { closeDb, connectDb } from '../../apps/api/src/db/client'
import { ensureIndexes, ensureSourceIndexes } from '../../apps/api/src/db/indexes'
import { importProducts } from '../../apps/api/src/services/products'
import { productInputSchema, type ProductInput } from '../../packages/shared/src'

const SOURCE = 'demo-supplier'

const categories = [
  { slug: 'home-kitchen', name: { bn: 'ঘর ও রান্নাঘর', en: 'Home & Kitchen' } },
  { slug: 'gadgets', name: { bn: 'গ্যাজেট', en: 'Gadgets' } },
  { slug: 'fashion', name: { bn: 'ফ্যাশন', en: 'Fashion' } },
]
const brand = { slug: 'demo-brand', name: { bn: 'ডেমো ব্র্যান্ড', en: 'Demo Brand' } }

const titles: [string, string][] = [
  ['ইলেকট্রিক কেটলি ১.৮ লিটার', 'Electric Kettle 1.8L'],
  ['ওয়্যারলেস ইয়ারবাড', 'Wireless Earbuds'],
  ['কটন পাঞ্জাবি', 'Cotton Panjabi'],
  ['নন-স্টিক ফ্রাই প্যান', 'Non-stick Fry Pan'],
  ['স্মার্ট ওয়াচ', 'Smart Watch'],
  ['লেডিস হ্যান্ডব্যাগ', 'Ladies Handbag'],
  ['রিচার্জেবল টেবিল ফ্যান', 'Rechargeable Table Fan'],
  ['ব্লেন্ডার মেশিন', 'Blender Machine'],
]

const image = (seed: string) => `https://picsum.photos/seed/123c-${seed}/800/800`
const demoVideo = {
  url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  poster: image('video-poster'),
}

/** Panjabi: color x size variants, each color with its own image, one combination sold out. */
const panjabiVariants = (): Pick<ProductInput, 'options' | 'variants' | 'images'> => {
  const colors = ['সাদা', 'নীল', 'মেরুন']
  const sizes = ['M', 'L', 'XL']
  return {
    images: colors.map((c, i) => ({ url: image(`panjabi-${i}`), alt: `Panjabi ${c}` })),
    options: [
      { name: 'রঙ', values: colors },
      { name: 'সাইজ', values: sizes },
    ],
    variants: colors.flatMap((color, ci) =>
      sizes.map((size, si) => ({
        sku: `PJ-${ci}-${size}`,
        options: { রঙ: color, সাইজ: size },
        price: 1290 + si * 100,
        compareAtPrice: 1690 + si * 100,
        costPrice: 800 + si * 60,
        stock: ci === 2 && size === 'XL' ? 0 : null,
        image: image(`panjabi-${ci}`),
      })),
    ),
  }
}

const products: ProductInput[] = titles.map(([bn, en], i) => ({
  externalId: `demo-${i + 1}`,
  title: { bn, en },
  description: {
    bn: `${bn} — উন্নত মানের পণ্য। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।\nপণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।`,
  },
  images: [
    { url: image(`${i + 1}`), alt: en },
    { url: image(`${i + 1}-b`), alt: en },
  ],
  videos: i % 3 === 0 ? [demoVideo] : [],
  price: 490 + i * 150,
  compareAtPrice: 690 + i * 180,
  costPrice: 300 + i * 100,
  stock: null,
  brand,
  categories: [categories[i % categories.length]!],
  options: [],
  variants: [],
  attributes: [{ name: 'ওয়ারেন্টি', value: '৭ দিনের রিপ্লেসমেন্ট' }],
  tags: [en.toLowerCase()],
  fulfillment: 'dropship',
  deliveryDays: { min: 2, max: 5 },
  featured: i < 4,
  ...(en.includes('Panjabi') ? { price: 1290, compareAtPrice: 1690, ...panjabiVariants() } : {}),
}))

await connectDb()
await ensureIndexes()
const now = new Date()
await collections.sources().updateOne(
  { slug: SOURCE },
  {
    $set: { name: 'Demo Supplier', type: 'dropship', active: true, updatedAt: now },
    $setOnInsert: { slug: SOURCE, createdAt: now },
  },
  { upsert: true },
)
await ensureSourceIndexes(SOURCE)
const result = await importProducts(
  SOURCE,
  // Parse like the import API does, so bad demo data fails here instead of in the store.
  products.map((p) => {
    const product = productInputSchema.parse(p)
    return { product, raw: { demo: true, ...product } }
  }),
)
console.log('Seeded demo products:', result)
// Give the debounced cache sync a moment to fire before exiting.
await new Promise((resolve) => setTimeout(resolve, 2500))
await closeDb()
