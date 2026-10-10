import type { IncomingMessage, ServerResponse } from 'node:http'

export const getHeader = (req: IncomingMessage, name: string): string | undefined => {
  const value = req.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

/** Railway/Render/Cloudflare sit in front of the API, so trust their forwarding headers. */
export const getClientIp = (req: IncomingMessage): string | null =>
  getHeader(req, 'cf-connecting-ip') ??
  getHeader(req, 'x-forwarded-for')?.split(',')[0]?.trim() ??
  getHeader(req, 'x-real-ip') ??
  req.socket.remoteAddress ??
  null

export const parseCookies = (req: IncomingMessage): Record<string, string> =>
  Object.fromEntries(
    (getHeader(req, 'cookie') ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key]) => key)
      .map(([key, ...rest]) => [key, decodeURIComponent(rest.join('='))]),
  )

type CookieOptions = {
  maxAge: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
  path?: string
  domain?: string
}

export const setCookie = (
  res: ServerResponse,
  name: string,
  value: string,
  opts: CookieOptions,
) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${opts.maxAge}`,
    `Path=${opts.path ?? '/'}`,
    `SameSite=${opts.sameSite ?? 'Lax'}`,
  ]
  if (opts.httpOnly !== false) parts.push('HttpOnly')
  if (opts.secure) parts.push('Secure')
  if (opts.domain) parts.push(`Domain=${opts.domain}`)
  const existing = res.getHeader('Set-Cookie')
  const list = Array.isArray(existing) ? existing : existing ? [String(existing)] : []
  res.setHeader('Set-Cookie', [...list, parts.join('; ')])
}
