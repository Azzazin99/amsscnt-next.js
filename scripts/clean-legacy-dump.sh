#!/usr/bin/env bash
# Remove literal \r / \n two-char sequences from MySQL→PostgreSQL dump file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DUMP="${LEGACY_DUMP_PATH:-smart_area_postgres.sql}"

if [[ ! -f "$DUMP" ]]; then
  echo "Error: dump file not found: $DUMP" >&2
  exit 1
fi

before=$(grep -c '\\r' "$DUMP" || true)
echo "Cleaning $DUMP ($before lines/occurrences with \\\\r)..."

if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' -e 's/\\r//g' -e 's/\\n//g' "$DUMP"
else
  sed -i -e 's/\\r//g' -e 's/\\n//g' "$DUMP"
fi

after=$(grep -c '\\r' "$DUMP" || true)
echo "Done. Remaining \\\\r occurrences: $after"
