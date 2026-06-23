#!/usr/bin/env bash
# Strip legacy \r artifacts from all text/varchar columns.
# Handles: literal backslash+r, literal backslash+n, real CR/LF (chr 13/10).
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

export PGPASSWORD

echo "Cleaning legacy \\\\r / CR from text columns in $PGDATABASE..."

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  r record;
  updated bigint;
  total bigint := 0;
BEGIN
  FOR r IN
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying', 'character')
      AND table_name NOT LIKE 'drizzle%'
    ORDER BY table_name, column_name
  LOOP
    EXECUTE format(
      $fmt$
      UPDATE %I.%I
      SET %I = btrim(
        replace(
          replace(
            replace(
              replace(%I, E'\\r', ''),
              E'\\n', ''
            ),
            chr(13), ''
          ),
          chr(10), ''
        )
      )
      WHERE %I IS NOT NULL
        AND (
          %I LIKE '%%\\r%%'
          OR %I LIKE '%%\\n%%'
          OR %I LIKE '%%' || chr(13) || '%%'
          OR %I LIKE '%%' || chr(10) || '%%'
        )
      $fmt$,
      r.table_schema,
      r.table_name,
      r.column_name,
      r.column_name,
      r.column_name,
      r.column_name,
      r.column_name,
      r.column_name,
      r.column_name
    );
    GET DIAGNOSTICS updated = ROW_COUNT;
    IF updated > 0 THEN
      RAISE NOTICE '  %.%: % rows', r.table_name, r.column_name, updated;
      total := total + updated;
    END IF;
  END LOOP;
  RAISE NOTICE 'Done. Total cell updates: %', total;
END $$;
SQL

echo "Legacy text cleanup finished."
