import { ObjectId } from 'mongodb'
import { collections } from '../db/collections'
import { hashPassword } from '../lib/crypto'

export const createOrUpdateAdmin = async (email: string, password: string, name = 'Admin') => {
  const passwordHash = await hashPassword(password)
  await collections.admins().updateOne(
    { email: email.toLowerCase() },
    {
      $set: { passwordHash, name },
      $setOnInsert: { _id: new ObjectId(), createdAt: new Date(), lastLoginAt: null },
    },
    { upsert: true },
  )
}

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if no admin exists yet. */
export const bootstrapAdmin = async (email?: string, password?: string) => {
  if (!email || !password) return false
  if ((await collections.admins().countDocuments({}, { limit: 1 })) > 0) return false
  await createOrUpdateAdmin(email, password)
  return true
}
