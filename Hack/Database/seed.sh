#!/usr/bin/env bash
# Add demo products to the LOCAL dev database (safe to run again).
#   ./Hack/Database/seed.sh
source "$(dirname "$0")/lib.sh"

# Runs in the api container so it gets the API's env (local mongo, cache sync URL).
docker compose run --rm api pnpm --filter @123/api exec tsx ../../Hack/Database/seed.ts
