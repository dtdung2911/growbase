#!/usr/bin/env bash
#
# GrowBase production deploy (self-hosted Supabase via Docker + pnpm monorepo + pm2).
# Run on the prod server, from anywhere:  bash /var/www/growbase/scripts/deploy-prod.sh
#
# Steps: pull -> pnpm install -> DB migrate (tracked, idempotent) -> build -> pm2 restart -> health check.
# Migrations are applied through a self-managed ledger table because raw psql
# (self-host) doesn't record them; each file runs once, in order, atomically.
#
# Config via env, e.g.:  DB_CONTAINER=supabase-db PM2_NAME=growbase bash scripts/deploy-prod.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/growbase}"
BRANCH="${BRANCH:-main}"
DB_CONTAINER="${DB_CONTAINER:-supabase-db}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
PM2_NAME="${PM2_NAME:-growbase}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/favicon.svg}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/growbase-backups}"

log() { printf '\n\033[1;34m>> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mFAILED: %s\033[0m\n' "$*" >&2; exit 1; }

cd "$APP_DIR" || die "APP_DIR not found: $APP_DIR"

# --- Code ---------------------------------------------------------------
log "Pulling $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

# --- Toolchain ----------------------------------------------------------
log "Activating pnpm from packageManager pin"
corepack enable
corepack install            # installs the exact pnpm from package.json "packageManager"
pnpm --version

log "Installing dependencies"
pnpm install --frozen-lockfile

# --- Database migrations ------------------------------------------------
psql_do() { docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -qtA "$@"; }

log "Backing up database"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/growbase-$(date +%F-%H%M%S).sql"
docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" \
  || die "backup failed (is DB_CONTAINER=$DB_CONTAINER correct? check: docker ps)"
echo "  saved $BACKUP_FILE"

log "Ensuring migration ledger"
psql_do -c "CREATE TABLE IF NOT EXISTS public.schema_migrations_app (
  filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"

# First run against an already-migrated DB: baseline every existing file as
# applied so we don't re-run schema that's already there (e.g. CREATE POLICY
# would fail). Trigger only when ledger is empty but the app schema exists.
ledger_count="$(psql_do -c "SELECT count(*) FROM public.schema_migrations_app;")"
has_schema="$(psql_do -c "SELECT to_regclass('public.households') IS NOT NULL;")"
if [ "$ledger_count" = "0" ] && [ "$has_schema" = "t" ]; then
  log "Baselining existing migrations (schema already present, ledger empty)"
  for f in supabase/migrations/*.sql; do
    fn="$(basename "$f")"
    psql_do -c "INSERT INTO public.schema_migrations_app(filename) VALUES ('$fn') ON CONFLICT DO NOTHING;"
    echo "  baselined $fn"
  done
fi

log "Applying pending migrations"
applied_any=0
for f in $(ls supabase/migrations/*.sql | sort); do
  fn="$(basename "$f")"
  already="$(psql_do -c "SELECT 1 FROM public.schema_migrations_app WHERE filename='$fn';")"
  [ "$already" = "1" ] && continue
  echo "  applying $fn"
  # migration + ledger insert in one transaction -> all-or-nothing
  { cat "$f"; printf "\nINSERT INTO public.schema_migrations_app(filename) VALUES ('%s');\n" "$fn"; } \
    | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 --single-transaction \
    || die "migration $fn failed (DB unchanged for this file; backup at $BACKUP_FILE)"
  applied_any=1
done
[ "$applied_any" = "0" ] && echo "  no pending migrations"

# --- Build --------------------------------------------------------------
log "Building web app"
pnpm build

# --- Restart ------------------------------------------------------------
log "Restarting pm2 process: $PM2_NAME"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start pnpm --name "$PM2_NAME" --cwd "$APP_DIR" -- --filter web start
fi
pm2 save

# --- Health check -------------------------------------------------------
log "Health check: $HEALTH_URL"
sleep 3
code="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)"
if [ "$code" = "200" ]; then
  printf '\n\033[1;32mDeploy OK — %s returned 200\033[0m\n' "$HEALTH_URL"
else
  die "health check got HTTP $code (expected 200). Check: pm2 logs $PM2_NAME"
fi
