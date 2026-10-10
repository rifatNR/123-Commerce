import 'server-only'
import type { AppRouter } from '@123/api/router'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createTRPCClient, httpLink } from '@trpc/client'

/** process.env wins so local dev (docker) isn't overridden by the production value in wrangler.jsonc. */
const apiBaseUrl = async () => {
  if (process.env.API_INTERNAL_URL) return process.env.API_INTERNAL_URL
  try {
    const { env } = await getCloudflareContext({ async: true })
    if (env.API_INTERNAL_URL) return env.API_INTERNAL_URL
  } catch {
    // Not running on Cloudflare (e.g. plain `next start`).
  }
  return 'http://localhost:4000'
}

/** tRPC client used by server components (SSR) to talk to the backend. */
export const serverApi = async () =>
  createTRPCClient<AppRouter>({
    links: [httpLink({ url: `${(await apiBaseUrl()).replace(/\/$/, '')}/trpc` })],
  })
