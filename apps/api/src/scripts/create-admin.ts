/**
 * Create an admin or reset an admin's password.
 *   docker compose run --rm api pnpm --filter @123/api admin:create <email> <password> [name]
 */
import { closeDb, connectDb } from '../db/client'
import { ensureIndexes } from '../db/indexes'
import { createOrUpdateAdmin } from '../services/admins'

const [email, password, name] = process.argv.slice(2)
if (!email || !password || password.length < 8) {
  console.error('Usage: admin:create <email> <password (min 8 chars)> [name]')
  process.exit(1)
}

await connectDb()
await ensureIndexes()
await createOrUpdateAdmin(email, password, name)
console.log(`Admin ${email} saved.`)
await closeDb()
