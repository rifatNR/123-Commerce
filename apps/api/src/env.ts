import { z } from 'zod'

const bool = z.enum(['true', 'false']).transform((v) => v === 'true')
const optional = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined))

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().default('commerce'),

  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  COOKIE_SECURE: bool.default(false),
  COOKIE_DOMAIN: optional,
  /** Use None only if web and api are on different sites (needs COOKIE_SECURE=true). */
  COOKIE_SAMESITE: z.enum(['Lax', 'Strict', 'None']).default('Lax'),

  ADMIN_EMAIL: optional,
  ADMIN_PASSWORD: optional,

  INGEST_API_KEY: z.string().min(16),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),

  FRONTEND_CACHE_SYNC_URL: optional,
  CACHE_SYNC_SECRET: optional,

  R2_ACCOUNT_ID: optional,
  R2_ACCESS_KEY_ID: optional,
  R2_SECRET_ACCESS_KEY: optional,
  R2_BUCKET: optional,
  R2_PUBLIC_BASE_URL: optional,

  DELIVERY_FEE_INSIDE_DHAKA: z.coerce.number().default(70),
  DELIVERY_FEE_OUTSIDE_DHAKA: z.coerce.number().default(130),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment variables:', z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
