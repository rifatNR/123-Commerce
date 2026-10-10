# Progress report: first build (Oct 2026)

## ✅ Done

**Monorepo & tooling**

- pnpm workspaces + Turborepo, TypeScript strict, ESLint (flat config; it errors on any `class`) + Prettier (with the Tailwind plugin).
- Docker-only dev: `docker compose up` runs `pnpm install` inside a container, then starts MongoDB, API and web
  as separate containers on one network. `node_modules` live in Docker volumes and never on your machine.
- Separate production setups: `docker-compose.prod.api.yml` (API image) and `docker-compose.prod.web.yml`
  (builds with OpenNext and deploys to Cloudflare).
- `pnpm-lock.yaml` is committed.

**Backend (`apps/api`)**

- tRPC on a plain Node HTTP server (no Express). Uses the native MongoDB driver (no Mongoose) and zod validation.
- Products: one fixed format in `products`. Each source keeps its raw records in its own collection
  (`src_<slug>`). Sources can be `dropship` or `own`. Products can be `dropship` or `self` fulfilled.
- Import API for your script: bulk upsert of up to 200 items per call, returning per-item errors. Also
  dedupe refs with hashes, list/get/update/delete by id or by externalId, and R2 presigned upload URLs.
- Categories and brands are created automatically on import. The admin can hide a category, brand or source,
  which hides all of its products. Visibility and featured flags survive re-imports.
- Orders: prices are recomputed from the DB, options and stock are validated, and Bangladeshi phone numbers
  are normalized (Bangla digits and +880 work). Order numbers are short and sequential. Delivery fee depends
  on the zone (inside/outside Dhaka).
- Each order tracks dropship status per item, plus a manual "Mark placed" action. A provider registry
  (`services/dropship/registry.ts`) is ready for automatic "Place Order to Drop Shipping" once a supplier
  offers an API. When every item is placed, the order moves to _Placed To Drop Shipping_ automatically.
- Customers are upserted by phone (order count, total spent, addresses, linked visitor ids).
- Visitors: IP, device/OS/browser, in-app browser (Facebook, Instagram, TikTok…), referrer, utm/fbclid,
  first touch plus the last 50 sessions.
- Auth: JWT access token (15 min) plus a rotating refresh token in an httpOnly cookie. Reusing an old refresh
  token revokes the whole session family. Passwords use scrypt. The first admin is created from env.
- In-memory rate limits on login, order creation, tracking and log reporting.
- Structured JSON logs. Frontend errors are stored in `client_logs` (deleted automatically after 30 days).

**Frontend (`apps/web`)**

- Bangla first (Hind Siliguri font, Bangla digits and ৳ formatting). All UI text is in `i18n/bn.ts`.
- Mobile first, red brand color (#E60023), large buttons and text for older users, trust badges
  (cash on delivery, delivery times, call to order).
- Pages: home (featured, latest, categories), listing (category chips, sort, search, pagination),
  product detail (gallery, options, quantity, "order now", call-to-order, share to Facebook/Messenger/WhatsApp),
  cart with a one-page checkout (name, phone, address, zone, note), order confirmation, privacy, terms, 404/error.
- Admin: orders list (status tabs with counts, search), order detail (copy button on every field,
  "copy all" and "copy for supplier" text, status changes, internal note, attribution info), products
  (filter by source, search, visible/featured toggles, bulk show/hide), categories & brands (visibility, sort order).
- KV caching: every public read goes KV first, then the API, then is stored in KV. `/api/cache` is the
  secret-protected route the backend calls to bump the cache generation and push fresh values.
- SEO: SSR, per-page metadata, canonical URLs, OG/Twitter tags (product image as og:image), Product +
  Organization JSON-LD, sitemap.xml, robots.txt, and a generated default OG image.
- Meta Pixel (optional) with AddToCart and Purchase events (Purchase uses the order number as eventID).
- Images: lazy loading through next/image, plus an optional Cloudflare Image Transformations loader (resize + WebP/AVIF).

**Verified (in a throwaway copy, since the Docker daemon wasn't running on this machine)**

- `typecheck`, `lint` and `prettier --check` pass on all packages.
- The API ran against a real (in-memory) MongoDB:
  - seeding, import, validation errors, missing-source error
  - storefront list/filter/sort/text search
  - login, refresh rotation, and refresh-token reuse detection
  - order creation (option, phone and stock checks)
  - dropship marking with automatic status change
  - category hiding
  - cache sync calls, coalesced into one write
- The production API bundle (`pnpm deploy` output) boots and passes its health check.
- The OpenNext Cloudflare build succeeds. Running it with `wrangler dev` (local KV):
  - every page returns 200 and an unknown product returns 404
  - KV cache hits are faster than misses (~0.05s vs ~0.2s)
  - `/api/cache` rejects bad secrets
  - a pushed value is served after the generation bump
  - sitemap and OG image work

**Not run here:** the Docker setup itself (`docker compose up`), because the Docker daemon was not running.
Please run it once and tell me if anything fails.

## ❌ Not done (yet)

- **Product import script**: not written, as you asked. The API it will call is documented in the README.
- **No admin product editor UI**: products are managed by your script. Admin can only show/hide and feature them.
  Image upload (presign) exists in the API but there's no upload UI.
- **No English UI toggle**: the UI is Bangla only, but text is centralized so adding `en.ts` is simple.
- **Visitor analytics**: data is collected, but there's no dashboard page yet (only an API: `visitors.list`).
- **No order editing** (changing items/address after placement), customer list page, CSV export, or SMS.
- **Facebook "social media account details"**: browsers don't expose who a Facebook user is. We record
  fbclid/utm, referrer and in-app browser instead. That's the most you can get without a Facebook login.
- **Static assets are not cached in KV**: Cloudflare already serves Worker static assets from its CDN, so
  storing them in KV would be slower and cost KV writes. KV is used for API responses only.
- **No automated tests.** I smoke-tested everything manually (see above). Tests are worth adding before the codebase grows.

## ⚠️ Things to know

- **Next.js is pinned to 16.3.8.** Next 16.4 (released Oct 6, 2026) breaks OpenNext 1.20: every route
  returned 500 (`Unexpected loadManifest(preview-props.json)`). Upgrade after OpenNext adds support.
- **KV is eventually consistent.** After a product change, other regions can take up to ~60s to see it, and
  each worker isolate re-reads the cache generation at most every 10s. That's fine for a store.
- **KV free plan allows only 1,000 writes/day.** Cache misses write to KV, so with real traffic use the Workers Paid plan ($5/mo).
- Rate limiting is in memory, which is fine for one API instance. Use Redis if you scale out.
- Privacy/Terms are **templates**. Fill in real business details and have them reviewed.
- Dev admin password is `admin12345`. Production must set `ADMIN_EMAIL`/`ADMIN_PASSWORD` and strong secrets.

## 💡 Things you may have missed (business + app)

1. **Fake orders are the #1 cost in Bangladeshi COD.** Add phone OTP or a missed-call check before
   confirming, block repeat cancellers, and check courier fraud history (e.g. Steadfast/Pathao) before shipping.
   The admin already shows how many orders a phone number has placed.
2. **Partial advance payment** (e.g. delivery charge via bKash/Nagad) massively reduces returns on
   outside-Dhaka orders. Worth adding early.
3. **Meta Conversions API (server-side)**: iOS and ad blockers drop many Pixel events. Sending Purchase events
   from the API (eventID is already the order number for dedupe) improves ad optimization.
4. **Courier integration** (Steadfast, Pathao, RedX, Paperfly) for booking and tracking. Your COD money comes
   back through them, so reconciliation matters.
5. **Return policy page** and visible **business contact** (address, phone, Facebook page). Facebook ads
   review, and trust, depend on it. A trade license / e-commerce DBID (Bangladesh's Digital Business
   Identity registration) is needed for payment gateways later.
6. **Pricing in your favor**: with dropshipping your margin = price − supplier cost − delivery − return losses.
   `costPrice` is stored per item so you can build a profit report.
7. **Supplier stock sync**: re-run your import script on a schedule so out-of-stock items get `stock: 0`.
8. **Landing pages per ad** (single product + order form on one page) convert better for FB traffic. The
   product page is already close to this ("order now" goes straight to checkout).
9. **Backups**: enable automated MongoDB backups (Atlas does this).
10. **Messenger/WhatsApp chat button**: many Bangladeshi customers prefer to ask before ordering.

## Decisions you might want to revisit

- _"Frontend requests the backend to save data in KV"_: I built it so the **backend pushes** to a frontend
  route (`/api/cache`). The frontend itself writes to KV on cache misses. That way KV access stays only in the frontend.
- _Separate collection per source_: done as you asked (`src_<slug>`). One `source_products` collection with a
  `sourceSlug` index would work just as well and is a bit simpler to query. It's an easy change if you prefer it.
- _Payment_: none, as you asked. All copy says "cash on delivery".
