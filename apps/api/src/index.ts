import { closeDb, connectDb } from './db/client'
import { ensureIndexes } from './db/indexes'
import { env } from './env'
import { logger } from './lib/logger'
import { bootstrapAdmin } from './services/admins'
import { startServer } from './server'

const main = async () => {
  await connectDb()
  await ensureIndexes()
  if (await bootstrapAdmin(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)) {
    logger.info('created first admin', { email: env.ADMIN_EMAIL })
  }
  const server = startServer()

  const shutdown = (signal: string) => {
    logger.info('shutting down', { signal })
    server.close(() => void closeDb().finally(() => process.exit(0)))
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

process.on('unhandledRejection', (err) => logger.error('unhandled rejection', { err }))

main().catch((err) => {
  logger.error('failed to start', { err })
  process.exit(1)
})
