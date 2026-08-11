#!/usr/bin/env bash
# Extract legacy book_* tables from AMSS_reduced.sql and load them into MySQL.
# Usage: bash scripts/load-legacy-book.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

DUMP="${LEGACY_DUMP_PATH:-AMSS_reduced.sql}"
DB_USER="${MYSQL_USER:-amss}"
DB_PASS="${MYSQL_PASSWORD:-amss}"
DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_NAME="${MYSQL_DB:-amsscntc_cnt}"

if [[ ! -f "$DUMP" ]]; then
  echo "Error: dump file not found: $DUMP" >&2
  exit 1
fi

TABLES=(
  book_main
  book_sendto_answer
  book_filebook
  book_group
  book_group_member
  book_permission
)

TMPFILE=$(mktemp)
trap "rm -f $TMPFILE" EXIT

echo "Extracting legacy book tables from $DUMP..."

TABLE_PATTERN=$(printf "%s|" "${TABLES[@]}")
TABLE_PATTERN="${TABLE_PATTERN%|}"

awk -v pattern="$TABLE_PATTERN" '
  BEGIN { in_block=0 }
  /^CREATE TABLE/ || /^INSERT INTO/ {
    for (i=1; i<=split(pattern, arr, "|"); i++) {
      tbl = "`" arr[i] "`"
      if (index($0, tbl) > 0) {
        in_block=1
        break
      }
    }
  }
  in_block {
    print
    if (/;[[:space:]]*$/) {
      in_block=0
      print ""
    }
  }
' "$DUMP" > "$TMPFILE"

FILESIZE=$(wc -c < "$TMPFILE" | tr -d ' ')
echo "Extracted ${FILESIZE} bytes"

if [[ "$FILESIZE" -lt 100 ]]; then
  echo "Warning: extracted file is very small. Tables may not exist in dump."
  cat "$TMPFILE"
  exit 1
fi

echo "Loading into MySQL ($DB_NAME @ $DB_HOST:$DB_PORT)..."
{
  echo "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';"
  echo "SET FOREIGN_KEY_CHECKS = 0;"
  echo "SET NAMES utf8mb4;"
  for TABLE in "${TABLES[@]}"; do
    echo "DROP TABLE IF EXISTS \`$TABLE\`;"
  done
  cat "$TMPFILE"
  echo "SET FOREIGN_KEY_CHECKS = 1;"
  echo "COMMIT;"
} | mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME"

echo "Done. Legacy book tables loaded."
echo "Now run: npx tsx scripts/import/import-book-standalone.ts"
