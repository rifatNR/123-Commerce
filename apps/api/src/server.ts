import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { nodeHTTPRequestHandler } from '@trpc/server/adapters/node-http'
import { env } from './env'
import { logger } from './lib/logger'
import { getHeader } from './lib/request'
import { appRouter } from './routers'
import { createContext } from './trpc/context'

const TRPC_PREFIX = '/trpc/'
const MAX_BODY_BYTES = 10 * 1024 * 1024

const applyCors = (req: IncomingMessage, res: ServerResponse) => {
  const origin = getHeader(req, 'origin')
  if (origin && env.CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'content-type, authorization, x-api-key, trpc-accept',
    )
    res.setHeader('Access-Control-Max-Age', '86400')
  }
}

const handle = async (req: IncomingMessage, res: ServerResponse) => {
  applyCors(req, res)
  const url = new URL(req.url ?? '/', 'http://localhost')

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end()
    return
  }
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true}')
    return
  }
  if (!url.pathname.startsWith(TRPC_PREFIX)) {
    res.writeHead(404).end()
    return
  }

  const started = Date.now()
  await nodeHTTPRequestHandler({
    req,
    res,
    path: url.pathname.slice(TRPC_PREFIX.length),
    router: appRouter,
    createContext,
    maxBodySize: MAX_BODY_BYTES,
    onError: ({ error, path }) => {
      if (error.code === 'INTERNAL_SERVER_ERROR')
        logger.error('trpc error', { path, err: error.cause ?? error })
      else logger.debug('trpc client error', { path, code: error.code, message: error.message })
    },
  })
  logger.debug('request', {
    method: req.method,
    path: url.pathname,
    status: res.statusCode,
    ms: Date.now() - started,
  })
}

export const startServer = () =>
  createServer((req, res) => {
    handle(req, res).catch((err) => {
      logger.error('unhandled request error', { err })
      if (!res.headersSent) res.writeHead(500).end()
    })
  }).listen(env.PORT, () => logger.info('api listening', { port: env.PORT }))
