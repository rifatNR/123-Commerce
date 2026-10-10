# 123Commerce

A lightweight, Bangla-first e-commerce store for dropshipping and your own products, with cash on delivery.

- `apps/web`: Next.js 16 (SSR) on Cloudflare Workers via OpenNext. Tailwind v4, zustand. Uses Cloudflare KV as a cache only.
- `apps/api`: Node.js + tRPC + MongoDB. Deployed on Railway, Render, or any Docker host.
- `packages/shared`: zod schemas, shared types, and cache keys.

```
Browser ──SSR──▶ Next.js (Cloudflare Worker) ──▶ KV cache ──miss──▶ API (tRPC) ──▶ MongoDB
Browser ──orders / admin / tracking──▶ API
API ──after data changes──▶ POST web/api/cache  (bump cache generation + push fresh values to KV)
```

## Local development (everything runs in Docker)

```bash
docker compose up            # installs deps in a container, starts mongo, api (:4000), web (:3000)
./Hack/Database/seed.sh      # optional demo products
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin (dev login `admin@123commerce.com` / `admin12345`)
- API: http://localhost:4000/trpc, health check at `/health`

All commands (dev, checks, database dump/restore/seed): see [HOW_TO_RUN.md](HOW_TO_RUN.md).

Run any other command in the tools container:

```bash
docker compose run --rm tools pnpm lint
docker compose run --rm tools pnpm typecheck
docker compose run --rm tools pnpm format
docker compose run --rm tools pnpm --filter @123/web add some-package
docker compose run --rm api pnpm --filter @123/api admin:create you@mail.com 'StrongPass123' 'Your Name'
```

Optional overrides: copy `apps/api/.env.example` → `apps/api/.env` and `apps/web/.env.example` → `apps/web/.env`.

> **Performance tip (Windows):** the repo is on `/mnt/c`. Bind mounts from the Windows filesystem are
> slow and need file-watch polling. Cloning into the WSL filesystem (e.g. `~/code/123-Commerce`)
> makes Docker dev much faster.

## Product import API (for your script)

All calls are tRPC over HTTP. Send header `x-api-key: <INGEST_API_KEY>`.
Queries use `GET /trpc/<path>?input=<url-encoded JSON>`. Mutations use `POST /trpc/<path>` with a JSON body.

| Purpose                                     | Procedure                                                                 | Type |
| ------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| Create/update a source (supplier)           | `sources.upsert` `{slug, name, type: "dropship"\|"own"}`                  | POST |
| List sources + product counts               | `sources.list`                                                            | GET  |
| What's already imported (externalId + hash) | `sources.productRefs` `{sourceSlug, page?}`                               | GET  |
| Raw stored source record                    | `sources.rawProduct` `{sourceSlug, externalId}`                           | GET  |
| Bulk create/update (≤200 per call)          | `products.import` `{sourceSlug, items: [{product, raw?, hash?}]}`         | POST |
| List / search                               | `products.list` `{sourceSlug?, q?, externalIds?, page, limit}`            | GET  |
| Get one                                     | `products.get` `{id}` or `{sourceSlug, externalId}`                       | GET  |
| Update                                      | `products.update` `{id, patch}` / `products.updateByExternalId`           | POST |
| Delete                                      | `products.delete` `{ids}` / `products.deleteByExternalIds`                | POST |
| Image upload URL (R2)                       | `uploads.presign` `{filename, contentType}` → PUT the file to `uploadUrl` | POST |

`product` follows the fixed format in [`packages/shared/src/schemas/product.ts`](packages/shared/src/schemas/product.ts).
Minimal example:

```json
{
  "sourceSlug": "supplier-a",
  "items": [
    {
      "product": {
        "externalId": "SKU-123",
        "title": { "bn": "ইলেকট্রিক কেটলি", "en": "Electric Kettle" },
        "images": [{ "url": "https://cdn.example.com/kettle.jpg" }],
        "price": 1290,
        "compareAtPrice": 1690,
        "costPrice": 850,
        "categories": [{ "slug": "kitchen", "name": { "bn": "রান্নাঘর" } }],
        "brand": { "slug": "miyako", "name": { "en": "Miyako" } },
        "videos": [{ "url": "https://cdn.example.com/kettle.mp4" }],
        "options": [{ "name": "রঙ", "values": ["লাল", "কালো"] }],
        "variants": [
          {
            "sku": "SKU-123-RED",
            "options": { "রঙ": "লাল" },
            "image": "https://cdn.example.com/kettle-red.jpg"
          },
          { "sku": "SKU-123-BLK", "options": { "রঙ": "কালো" }, "price": 1390, "stock": 0 }
        ]
      },
      "raw": { "...": "original supplier JSON" }
    }
  ]
}
```

Dedupe flow: call `sources.productRefs`, skip items whose `hash` matches, import the rest. The default hash is
`sha1(JSON.stringify(raw ?? product))`, or send your own `hash`. If you leave `visible`/`featured` out,
re-imports keep whatever the admin set.

Variants: each variant sets a value for every option. Customers can only buy listed variants,
and a variant's `price`/`compareAtPrice`/`costPrice`/`stock` override the product's when set.
Without `variants`, every option combination is buyable at the product price.

## Production

### API (Railway / Render / VPS)

- Railway/Render: point them at `apps/api/Dockerfile` with the repo root as build context.
- VPS: `docker compose -f docker-compose.prod.api.yml up -d --build` (uses `apps/api/.env.production`).
- Use MongoDB Atlas (or another managed MongoDB). Set strong `JWT_ACCESS_SECRET`, `INGEST_API_KEY`,
  `CACHE_SYNC_SECRET`. Set `COOKIE_SECURE=true` and `CORS_ORIGINS=https://123commerce.com`.
  Set `FRONTEND_CACHE_SYNC_URL=https://123commerce.com/api/cache`.
- Put the API on a subdomain of the store (e.g. `api.123commerce.com`) so the admin refresh cookie stays first-party.

### Web (Cloudflare Workers)

1. `wrangler kv namespace create CACHE_KV` → paste the id into `apps/web/wrangler.jsonc`.
2. Set `API_INTERNAL_URL` in `wrangler.jsonc` vars, and `wrangler secret put CACHE_SYNC_SECRET`.
3. Deploy from Docker: `docker compose -f docker-compose.prod.web.yml --env-file apps/web/.env.production run --rm deploy`
   (needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the `NEXT_PUBLIC_*` values).
   Cloudflare "Workers Builds" (git integration) running `pnpm --filter @123/web cf:deploy` also works.
4. Optional: enable Image Transformations on the zone and build with `NEXT_PUBLIC_IMAGE_LOADER=cloudflare`.

See [docs/PROGRESS.md](docs/PROGRESS.md) for what's done, what isn't, and recommendations.
