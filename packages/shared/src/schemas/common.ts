import { z } from 'zod'

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and dashes')

export const localizedTextSchema = z
  .object({
    bn: z.string().trim().max(20000).optional(),
    en: z.string().trim().max(20000).optional(),
  })
  .refine((t) => Boolean(t.bn || t.en), 'Provide at least bn or en text')
export type LocalizedText = z.infer<typeof localizedTextSchema>

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id')

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(500).default(50),
})

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number }
