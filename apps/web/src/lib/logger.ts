type Level = 'debug' | 'info' | 'warn' | 'error'

const serialize = (data?: Record<string, unknown>) => {
  if (!data) return data
  const err = data.err
  return err instanceof Error ? { ...data, err: { message: err.message, stack: err.stack } } : data
}

/** Structured JSON logs. On Cloudflare these show up in Workers Logs (observability is enabled). */
const write = (level: Level, msg: string, data?: Record<string, unknown>) => {
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...serialize(data) })
  if (level === 'error' || level === 'warn') console.error(line)
  else if (level === 'info' || process.env.NODE_ENV !== 'production') console.log(line)
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => write('debug', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => write('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => write('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => write('error', msg, data),
}
