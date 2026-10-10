# Shared helpers for the database scripts. Sourced, not run directly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_DIR="$ROOT/Hack/Database"
DUMPS="$DB_DIR/dumps"
LOCAL_DB=commerce
cd "$ROOT"

# Production connection lives in Hack/Database/.env (git-ignored). See .env.example.
load_prod_env() {
  [[ -f "$DB_DIR/.env" ]] || { echo "Missing $DB_DIR/.env (copy .env.example)"; exit 1; }
  set -a
  # shellcheck disable=SC1091
  source "$DB_DIR/.env"
  set +a
  : "${PROD_MONGODB_URI:?PROD_MONGODB_URI is not set in Hack/Database/.env}"
  PROD_MONGODB_DB="${PROD_MONGODB_DB:-commerce}"
}

start_mongo() {
  docker compose up -d --wait mongo >/dev/null 2>&1
}

local_mongosh() {
  docker compose exec -T mongo mongosh --quiet "$LOCAL_DB" --eval "$1"
}

# Skip with YES=1.
confirm() {
  [[ "${YES:-}" == 1 ]] && return
  read -r -p "$1 [y/N] " answer
  [[ "$answer" == y || "$answer" == Y ]] || { echo "Aborted."; exit 1; }
}

is_running() {
  [[ -n "$(docker compose ps --status running -q "$1" 2>/dev/null)" ]]
}

# After the data changes under it: restart the API (re-creates indexes and the dev admin)
# and drop the web's cached pages.
refresh_app() {
  if is_running api; then
    docker compose restart api >/dev/null 2>&1 && echo "API restarted."
  fi
  if is_running web; then
    docker compose exec -T web node -e "
      fetch('http://localhost:3000/api/cache', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.CACHE_SYNC_SECRET },
        body: JSON.stringify({ bump: true }),
      }).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))
    " && echo "Web cache cleared." || echo "Could not clear the web cache (it expires on its own)."
  fi
}
