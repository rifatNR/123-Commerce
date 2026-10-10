import { ObjectId } from 'mongodb'
import { SignJWT, jwtVerify } from 'jose'
import { collections } from '../db/collections'
import { env } from '../env'
import { randomToken, sha256 } from '../lib/crypto'

const accessKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET)

export type AccessClaims = { sub: string; email: string }

export const signAccessToken = (claims: AccessClaims) =>
  new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(accessKey)

export const verifyAccessToken = async (token: string): Promise<AccessClaims | null> => {
  try {
    const { payload } = await jwtVerify(token, accessKey, { algorithms: ['HS256'] })
    return payload.sub && typeof payload.email === 'string'
      ? { sub: payload.sub, email: payload.email }
      : null
  } catch {
    return null
  }
}

const refreshTtlMs = () => env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000

/** Refresh tokens are opaque random strings; only their hash is stored. */
export const issueRefreshToken = async (adminId: ObjectId, family = randomToken(12)) => {
  const token = randomToken()
  await collections.refreshTokens().insertOne({
    _id: new ObjectId(),
    tokenHash: sha256(token),
    adminId,
    family,
    expiresAt: new Date(Date.now() + refreshTtlMs()),
    revokedAt: null,
    createdAt: new Date(),
  })
  return { token, maxAgeSeconds: Math.floor(refreshTtlMs() / 1000) }
}

/**
 * Rotates a refresh token. Returns null if invalid. If an already-rotated token is reused
 * (likely stolen), the whole token family is revoked.
 */
export const rotateRefreshToken = async (token: string) => {
  const tokens = collections.refreshTokens()
  const doc = await tokens.findOne({ tokenHash: sha256(token) })
  if (!doc || doc.expiresAt < new Date()) return null
  if (doc.revokedAt) {
    await tokens.updateMany(
      { family: doc.family, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    )
    return null
  }
  const revoked = await tokens.updateOne(
    { _id: doc._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )
  if (revoked.modifiedCount === 0) return null
  const next = await issueRefreshToken(doc.adminId, doc.family)
  return { adminId: doc.adminId, ...next }
}

export const revokeRefreshToken = async (token: string) => {
  const doc = await collections.refreshTokens().findOne({ tokenHash: sha256(token) })
  if (doc) {
    await collections
      .refreshTokens()
      .updateMany({ family: doc.family, revokedAt: null }, { $set: { revokedAt: new Date() } })
  }
}
