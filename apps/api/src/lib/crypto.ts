import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

export const randomToken = (bytes = 48) => randomBytes(bytes).toString('base64url')

/** Stable hash of any JSON value, used to detect unchanged source records. */
export const hashJson = (value: unknown) =>
  createHash('sha1')
    .update(JSON.stringify(value) ?? '')
    .digest('hex')

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, 64)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export const verifyPassword = async (password: string, stored: string) => {
  const [algo, saltB64, keyB64] = stored.split('$')
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64')
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length)
  return timingSafeEqual(actual, expected)
}

export const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}
