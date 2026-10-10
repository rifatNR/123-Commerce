import { slugify } from '@123/shared'
import { z } from 'zod'
import { randomToken } from '../lib/crypto'
import { presignUpload } from '../services/r2'
import { integrationProcedure, router } from '../trpc/init'

const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const

export const uploadsRouter = router({
  /** Returns a presigned R2 URL. PUT the file there with the same content-type, then use `publicUrl`. */
  presign: integrationProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(200),
        contentType: z.enum(Object.keys(IMAGE_TYPES) as [keyof typeof IMAGE_TYPES]),
        folder: z.enum(['products', 'catalog', 'misc']).default('products'),
      }),
    )
    .mutation(({ input }) => {
      const now = new Date()
      const name = slugify(input.filename.replace(/\.[^.]+$/, '')) || 'image'
      const month = String(now.getUTCMonth() + 1).padStart(2, '0')
      const key = `${input.folder}/${now.getUTCFullYear()}/${month}/${randomToken(6)}-${name}.${IMAGE_TYPES[input.contentType]}`
      return presignUpload(key, input.contentType)
    }),
})
