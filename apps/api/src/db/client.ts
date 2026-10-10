import { MongoClient, type Db } from 'mongodb'
import { env } from '../env'

const client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 20 })
let db: Db | null = null

export const connectDb = async () => {
  await client.connect()
  db = client.db(env.MONGODB_DB)
  return db
}

export const getDb = () => {
  if (!db) throw new Error('Database not connected. Call connectDb() first.')
  return db
}

export const closeDb = () => client.close()
