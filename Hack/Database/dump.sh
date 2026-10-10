#!/usr/bin/env bash
# Dump a database to Hack/Database/dumps/<target>-<db>-<time>.archive.gz
#   ./Hack/Database/dump.sh          # local dev database
#   ./Hack/Database/dump.sh prod     # production (needs Hack/Database/.env)
source "$(dirname "$0")/lib.sh"

target="${1:-local}"
mkdir -p "$DUMPS"
stamp="$(date +%Y%m%d-%H%M%S)"

case "$target" in
  local)
    start_mongo
    file="$DUMPS/local-$LOCAL_DB-$stamp.archive.gz"
    run() { docker compose exec -T mongo mongodump --quiet --db "$LOCAL_DB" --archive --gzip; }
    ;;
  prod)
    load_prod_env
    file="$DUMPS/prod-$PROD_MONGODB_DB-$stamp.archive.gz"
    # Same image as local mongo, so tool versions match. URI goes in as env, not on the command line.
    run() {
      docker run --rm -e URI="$PROD_MONGODB_URI" -e DB="$PROD_MONGODB_DB" mongo:8 \
        sh -c 'mongodump --quiet --uri "$URI" --db "$DB" --archive --gzip'
    }
    ;;
  *)
    echo "Usage: dump.sh [local|prod]"
    exit 1
    ;;
esac

echo "Dumping $target..."
if ! run >"$file"; then
  rm -f "$file"
  echo "Dump failed."
  exit 1
fi
echo "Saved $file ($(du -h "$file" | cut -f1))"
