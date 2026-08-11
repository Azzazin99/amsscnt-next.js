#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-amss}"
PGPASSWORD="${POSTGRES_PASSWORD:-amss}"
PGDATABASE="${POSTGRES_DB:-amss}"
DUMP="${LEGACY_DUMP_PATH:-AMSS.sql}"

export PGPASSWORD

if [[ ! -f "$DUMP" ]]; then
  echo "Error: dump file not found: $DUMP" >&2
  exit 1
fi

echo "Loading legacy dump into PostgreSQL ($PGDATABASE @ $PGHOST:$PGPORT)..."
echo "This may take 5–15 minutes for smart_area_postgres.sql"

# Sanitize via scripts/pipe-legacy-dump-sanitize.ts (shared with web export).
cat "$DUMP" | npx tsx "$ROOT/scripts/pipe-legacy-dump-sanitize.ts" | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  -v ON_ERROR_STOP=1 \
  -f -

echo "Legacy dump loaded. Legacy tables (e.g. system_user, bookregister_receive) are in public schema."
echo "Stripping legacy \\\\r artifacts from text columns..."
bash "$ROOT/scripts/clean-legacy-text.sh"
