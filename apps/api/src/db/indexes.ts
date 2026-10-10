import { collections } from './collections'

/** Idempotent; runs on every startup. Source collections get their index on first import. */
export const ensureIndexes = async () => {
  await Promise.all([
    collections.products().createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { sourceSlug: 1, externalId: 1 }, unique: true },
      { key: { visible: 1, createdAt: -1 } },
      { key: { visible: 1, featured: 1, createdAt: -1 } },
      { key: { categorySlugs: 1, visible: 1 } },
      { key: { brandSlug: 1, visible: 1 } },
      { key: { price: 1 } },
      {
        key: { 'title.bn': 'text', 'title.en': 'text', tags: 'text' },
        name: 'product_text',
        default_language: 'none',
      },
    ]),
    collections.sources().createIndex({ slug: 1 }, { unique: true }),
    collections.categories().createIndex({ slug: 1 }, { unique: true }),
    collections.brands().createIndex({ slug: 1 }, { unique: true }),
    collections
      .orders()
      .createIndexes([
        { key: { orderNumber: 1 }, unique: true },
        { key: { status: 1, createdAt: -1 } },
        { key: { 'customer.phone': 1 } },
        { key: { createdAt: -1 } },
      ]),
    collections.customers().createIndex({ phone: 1 }, { unique: true }),
    collections
      .visitors()
      .createIndexes([{ key: { visitorId: 1 }, unique: true }, { key: { lastSeenAt: -1 } }]),
    collections.admins().createIndex({ email: 1 }, { unique: true }),
    collections
      .refreshTokens()
      .createIndexes([
        { key: { tokenHash: 1 }, unique: true },
        { key: { family: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      ]),
    collections
      .clientLogs()
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }),
  ])
}

export const ensureSourceIndexes = (sourceSlug: string) =>
  collections.sourceProducts(sourceSlug).createIndex({ externalId: 1 }, { unique: true })
