/**
 * Demo data for local development only.
 *   docker compose run --rm api pnpm --filter @123/api seed
 */
import type { ProductInput } from '@123/shared'
import { ObjectId } from 'mongodb'
import { collections } from '../db/collections'
import { closeDb, connectDb } from '../db/client'
import { ensureIndexes, ensureSourceIndexes } from '../db/indexes'
import { importProducts } from '../services/products'

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

const products: ProductInput[] = titles.map(([bn, en], i) => ({
  externalId: `demo-${i + 1}`,
  title: { bn, en },
  description: {
    bn: `${bn} — উন্নত মানের পণ্য। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।\nপণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।`,
  },
  images: [{ url: `https://picsum.photos/seed/123c-${i + 1}/800/800`, alt: en }],
  price: 490 + i * 150,
  compareAtPrice: 690 + i * 180,
  costPrice: 300 + i * 100,
  stock: null,
  brand,
  categories: [categories[i % categories.length]!],
  options: en.includes('Panjabi') ? [{ name: 'সাইজ', values: ['M', 'L', 'XL'] }] : [],
  attributes: [{ name: 'ওয়ারেন্টি', value: '৭ দিনের রিপ্লেসমেন্ট' }],
  tags: [en.toLowerCase()],
  fulfillment: 'dropship',
  deliveryDays: { min: 2, max: 5 },
  featured: i < 4,
}))

await connectDb()
await ensureIndexes()
const now = new Date()
await collections.sources().updateOne(
  { slug: 'demo-supplier' },
  {
    $set: { name: 'Demo Supplier', type: 'dropship', active: true, updatedAt: now },
    $setOnInsert: { _id: new ObjectId(), slug: 'demo-supplier', createdAt: now },
  },
  { upsert: true },
)
await ensureSourceIndexes('demo-supplier')
const result = await importProducts(
  'demo-supplier',
  products.map((product) => ({ product, raw: { demo: true, ...product } })),
)
console.log('Seeded demo products:', result)
// Give the debounced cache sync a moment to fire before exiting.
await new Promise((resolve) => setTimeout(resolve, 2500))
await closeDb()
