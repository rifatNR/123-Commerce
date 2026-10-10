# 123Commerce — rules for working in this repo

## Environment

- Everything runs in Docker. Never run `pnpm install` / `pnpm dev` on the host.
  Use `docker compose up` and `docker compose run --rm tools pnpm <cmd>`.
- Monorepo: pnpm workspaces + Turborepo. `apps/api` (Node + tRPC + MongoDB), `apps/web` (Next.js on
  Cloudflare Workers via OpenNext), `packages/shared` (zod schemas, types, cache keys).
- `next` is pinned to `~16.3.8`: Next 16.4 emits a manifest OpenNext 1.20 can't load (every route 500s
  on Workers). Only upgrade after confirming `@opennextjs/cloudflare` supports it.

## Code style

- Functional code only: no classes (ESLint enforces). Plain functions and functional React components.
- One component per file (tiny helpers like icons are the exception).
- Put repeated logic in `lib/` helpers instead of copy-pasting.
- State management: zustand (`apps/web/src/stores`). No other state library.
- Keep it lightweight: don't add a dependency when a few lines of code will do.
- Prettier + ESLint must pass: `docker compose run --rm tools pnpm lint && pnpm format:check`.

## Architecture rules

- Every input schema and every shared type lives in `packages/shared`. API and web import from there.
- Products are stored in ONE fixed format (`productInputSchema`). Raw supplier data goes to that
  source's own collection `src_<slug>`. To support a new source shape, change the import script, not the schema.
  Extra fields go into `attributes` (shown to customers) or `meta` (internal).
- Prices are always recomputed on the server from the DB. Never trust prices sent by the client.
- Never expose `costPrice`, `meta`, or `sourceSlug` through `storefront.*` procedures.
- Cloudflare KV is used ONLY as a cache for API responses (`apps/web/src/lib/kv-cache.ts`).
  All public reads go through `lib/storefront.ts` → `cached()`.
  After any data change, the API calls `syncCache()` (bumps the cache generation and optionally pushes fresh values).
  Use the `cacheKeys` in `packages/shared` for KV keys.
- Auth: short-lived JWT access token kept in memory (zustand), plus a rotating opaque refresh token in an
  httpOnly cookie. Import script uses `x-api-key` (`integrationProcedure`).
- Customer-facing text is Bangla and lives in `apps/web/src/i18n/bn.ts`. Admin UI is English.
- Mobile first, large tap targets (≥44px), simple flows. Many users are older and not tech-savvy.
