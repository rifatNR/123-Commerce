import { z } from 'zod'
import { SOURCE_TYPES } from '../constants'
import { slugSchema } from './common'

export const sourceInputSchema = z.object({
  slug: slugSchema.max(40),
  name: z.string().min(1).max(120),
  type: z.enum(SOURCE_TYPES).default('dropship'),
  website: z.url().optional(),
  contact: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  active: z.boolean().default(true),
  /** Free-form settings, e.g. supplier API config for automatic order placement. */
  config: z.record(z.string(), z.unknown()).optional(),
})
export type SourceInput = z.infer<typeof sourceInputSchema>

export type SourceDto = SourceInput & {
  id: string
  productCount: number
  createdAt: string
  updatedAt: string
}

export type SourceProductRef = {
  externalId: string
  hash: string
  productId: string | null
  syncedAt: string
}
