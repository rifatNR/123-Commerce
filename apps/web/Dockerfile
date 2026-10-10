# Builds the Cloudflare Worker bundle (OpenNext). Build context: repository root.
# Used by docker-compose.prod.web.yml, which then runs `opennextjs-cloudflare deploy`.
FROM node:24-bookworm-slim
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1 WRANGLER_SEND_METRICS=false
RUN corepack enable
WORKDIR /repo

ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPPORT_PHONE
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_IMAGE_LOADER
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPPORT_PHONE=$NEXT_PUBLIC_SUPPORT_PHONE \
    NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID \
    NEXT_PUBLIC_IMAGE_LOADER=$NEXT_PUBLIC_IMAGE_LOADER

COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter @123/web... --frozen-lockfile
COPY packages/shared packages/shared
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/
COPY apps/web apps/web
RUN pnpm --filter @123/web exec opennextjs-cloudflare build
