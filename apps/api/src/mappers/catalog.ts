import type { CatalogItemDto, SourceDto } from '@123/shared'
import type { CatalogDoc, SourceDoc } from '../db/types'

export const toCatalogDto = (doc: CatalogDoc, productCount?: number): CatalogItemDto => ({
  slug: doc.slug,
  name: doc.name,
  image: doc.image,
  visible: doc.visible,
  sortOrder: doc.sortOrder,
  ...(productCount === undefined ? {} : { productCount }),
})

export const toSourceDto = (doc: SourceDoc, productCount: number): SourceDto => ({
  id: doc._id.toHexString(),
  slug: doc.slug,
  name: doc.name,
  type: doc.type,
  website: doc.website,
  contact: doc.contact,
  notes: doc.notes,
  active: doc.active,
  config: doc.config,
  productCount,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
})
