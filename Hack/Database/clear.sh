#!/usr/bin/env bash
# Delete everything in the LOCAL dev database.
#   ./Hack/Database/clear.sh
source "$(dirname "$0")/lib.sh"

confirm "Delete ALL data in local '$LOCAL_DB'?"
start_mongo
local_mongosh 'db.dropDatabase()' >/dev/null
echo "Local '$LOCAL_DB' cleared."
refresh_app
