# Development image: Node + pnpm. The source code is bind-mounted, nothing is copied in.
# Debian (glibc) rather than Alpine because Cloudflare's local runtime (workerd) needs glibc.
FROM node:24-bookworm-slim

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1 \
    WRANGLER_SEND_METRICS=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.34.6 --activate

WORKDIR /app
