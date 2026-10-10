import { env } from '../env'

type Level = 'debug' | 'info' | 'warn' | 'error'
const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

const serializeError = (err: unknown) =>
  err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err

/** One JSON object per line: easy to search in Railway/Render log viewers. */
const write = (level: Level, msg: string, data?: Record<string, unknown>) => {
  if (LEVELS[level] < LEVELS[env.LOG_LEVEL]) return
  const entry = { time: new Date().toISOString(), level, msg, ...data }
  if ('err' in entry) entry.err = serializeError(entry.err)
  const line = JSON.stringify(entry)
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => write('debug', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => write('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => write('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => write('error', msg, data),
}
