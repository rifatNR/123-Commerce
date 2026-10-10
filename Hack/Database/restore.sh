#!/usr/bin/env bash
# Replace the LOCAL dev database with a dump. Never touches production.
#   ./Hack/Database/restore.sh                         # newest dump in Hack/Database/dumps
#   ./Hack/Database/restore.sh path/to/x.archive.gz    # a specific dump
# Source db name is read from the file name (<target>-<db>-<time>.archive.gz); override with FROM_DB=name.
source "$(dirname "$0")/lib.sh"

file="${1:-$(ls -t "$DUMPS"/*.archive.gz 2>/dev/null | head -1 || true)}"
[[ -n "$file" && -f "$file" ]] || { echo "No dump found. Run dump.sh first or pass a file."; exit 1; }

from_db="${FROM_DB:-$(basename "$file" | sed -E 's/^[a-z]+-(.+)-[0-9]{8}-[0-9]{6}\.archive\.gz$/\1/')}"
[[ "$from_db" != "$(basename "$file")" ]] || { echo "Can't read the db name from the file name. Set FROM_DB=name."; exit 1; }

confirm "Replace local '$LOCAL_DB' with $(basename "$file") (db '$from_db')?"
start_mongo
local_mongosh 'db.dropDatabase()' >/dev/null
docker compose exec -T mongo mongorestore --quiet --archive --gzip \
  --nsInclude "$from_db.*" --nsFrom "$from_db.*" --nsTo "$LOCAL_DB.*" <"$file"
echo "Restored into local '$LOCAL_DB'."
refresh_app
