#!/usr/bin/env bash
# Setup PostgreSQL for local dev without Docker (Homebrew Postgres).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PGUSER_LOCAL="${PGUSER:-$(whoami)}"
PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
APP_USER="${POSTGRES_USER:-amss}"
APP_PASS="${POSTGRES_PASSWORD:-amss}"
APP_DB="${POSTGRES_DB:-amss}"

echo "==> Creating role/database ($APP_USER @ $APP_DB)..."
psql -h "$PGHOST" -p "$PGPORT" -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_USER}') THEN
    CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASS}' CREATEDB;
  ELSE
    ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${APP_DB} OWNER ${APP_USER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${APP_DB}')\\gexec
GRANT ALL PRIVILEGES ON DATABASE ${APP_DB} TO ${APP_USER};
SQL

echo "==> Running Drizzle migrations..."
npm run db:migrate

echo ""
echo "Optional — load demo data (สงขลา 2, ~10 sec on local Postgres):"
echo "  npm run db:load-legacy"
echo "  npm run db:import-smart-area -- --scope=core,bookregister"
echo "  # mail + book inbox: --scope=full --legacy-master"
echo "  npm run storage:copy-samples   # needs ../Amssplus"
echo ""
echo "Dev DB browser (admin): http://localhost:3000/admin/dev/database"
echo "Test login: admin / Imported123"
