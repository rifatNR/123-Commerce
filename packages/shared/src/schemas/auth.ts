import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
})

export type AdminDto = { id: string; email: string; name: string }
export type AuthResult = { accessToken: string; expiresIn: number; admin: AdminDto }
