#!/usr/bin/env bash
#
# Rotates the production PostgreSQL password and deploys the latest code.
#
# Run this ON THE PRODUCTION SERVER, from anywhere (it locates the repo
# itself). It will:
#   1. Back up the current .env files.
#   2. git pull the latest code.
#   3. Restore/recreate .env from the backup (the repo no longer tracks
#      .env, so a fresh pull won't recreate it on its own).
#   4. Generate a new random DB password and ALTER the live Postgres role
#      to use it (does not touch table data).
#   5. Write the new password into .env / ovii_backend/.env.
#   6. Rebuild and restart the containers so the new code and new
#      password take effect.
#
# Usage:
#   ./rotate-db-password.sh [-b branch] [-d compose-project-dir] [-y]
#
#   -b  Git branch to pull (default: master)
#   -d  Path to the directory containing docker-compose.yml
#       (default: auto-detected from this script's location)
#   -y  Skip the confirmation prompt
#
set -euo pipefail

BRANCH="master"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSUME_YES=0

while getopts "b:d:y" opt; do
  case "$opt" in
    b) BRANCH="$OPTARG" ;;
    d) PROJECT_DIR="$OPTARG" ;;
    y) ASSUME_YES=1 ;;
    *) echo "Usage: $0 [-b branch] [-d compose-project-dir] [-y]" >&2; exit 1 ;;
  esac
done

cd "$PROJECT_DIR"

if [ ! -f docker-compose.yml ]; then
  echo "error: docker-compose.yml not found in $PROJECT_DIR (use -d to point at the repo root)" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is not installed or not on PATH" >&2
  exit 1
fi

COMPOSE="docker compose"
if ! $COMPOSE version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
  else
    echo "error: neither 'docker compose' nor 'docker-compose' is available" >&2
    exit 1
  fi
fi

ROOT_ENV="$PROJECT_DIR/.env"
BACKEND_ENV="$PROJECT_DIR/ovii_backend/.env"

if [ ! -f "$ROOT_ENV" ]; then
  echo "error: $ROOT_ENV not found -- nothing to rotate" >&2
  exit 1
fi

if [ "$ASSUME_YES" -ne 1 ]; then
  read -r -p "This will rotate the production DB password and pull '$BRANCH' into $PROJECT_DIR. Continue? [y/N] " reply
  case "$reply" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

BACKUP_DIR="$HOME/ovii-env-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$ROOT_ENV" "$BACKUP_DIR/root.env"
[ -f "$BACKEND_ENV" ] && cp "$BACKEND_ENV" "$BACKUP_DIR/ovii_backend.env"
chmod 600 "$BACKUP_DIR"/*.env
echo "Backed up current .env file(s) to $BACKUP_DIR"

get_env_value() {
  # get_env_value <file> <key>
  local file="$1" key="$2"
  grep -E "^${key}=" "$file" | tail -n1 | cut -d'=' -f2-
}

DB_USER="$(get_env_value "$ROOT_ENV" DATABASE_USER)"
DB_NAME="$(get_env_value "$ROOT_ENV" DATABASE_NAME)"
OLD_PASSWORD="$(get_env_value "$ROOT_ENV" DATABASE_PASSWORD)"

if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ] || [ -z "$OLD_PASSWORD" ]; then
  echo "error: could not read DATABASE_USER/DATABASE_NAME/DATABASE_PASSWORD from $ROOT_ENV" >&2
  exit 1
fi

echo "==> Pulling latest code (branch: $BRANCH)"
if [ -n "$(git status --porcelain)" ]; then
  echo "Local changes detected -- stashing them before pulling (env files are already backed up separately)."
  git stash push --include-untracked -m "rotate-db-password.sh pre-pull stash $(date -Iseconds)"
  STASHED=1
else
  STASHED=0
fi

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [ "$STASHED" -eq 1 ]; then
  echo "Restoring stashed local changes..."
  git stash pop || echo "warning: 'git stash pop' had conflicts -- resolve manually, your prior local changes are in 'git stash list'"
fi

# .env is gitignored and no longer tracked, so a pull won't recreate it.
if [ ! -f "$ROOT_ENV" ]; then
  cp "$BACKUP_DIR/root.env" "$ROOT_ENV"
fi
if [ ! -f "$BACKEND_ENV" ] && [ -f "$BACKUP_DIR/ovii_backend.env" ]; then
  cp "$BACKUP_DIR/ovii_backend.env" "$BACKEND_ENV"
fi

echo "==> Generating new password"
# openssl produces a fixed amount of output and exits on its own, so this
# pipeline is safe under 'set -o pipefail' (unlike piping /dev/urandom
# through 'head', which SIGPIPEs the upstream reader and would abort the
# script here). Alphanumeric-only so it's safe to embed in the unescaped
# postgresql:// URL that settings.py builds from these values.
NEW_PASSWORD="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32)"
if [ "${#NEW_PASSWORD}" -lt 32 ]; then
  echo "error: failed to generate a new password" >&2
  exit 1
fi

echo "==> Rotating the live Postgres role password"
$COMPOSE up -d db
for i in $(seq 1 30); do
  if $COMPOSE exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

$COMPOSE exec -T -e PGPASSWORD="$OLD_PASSWORD" db \
  psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  -c "ALTER USER \"$DB_USER\" WITH PASSWORD '$NEW_PASSWORD';"

echo "==> Writing new password into .env file(s)"
for f in "$ROOT_ENV" "$BACKEND_ENV"; do
  [ -f "$f" ] || continue
  sed -i.bak \
    -e "s#^DATABASE_PASSWORD=.*#DATABASE_PASSWORD=${NEW_PASSWORD}#" \
    -e "s#^POSTGRES_PASSWORD=.*#POSTGRES_PASSWORD=${NEW_PASSWORD}#" \
    "$f"
  rm -f "$f.bak"
done

echo "==> Rebuilding and restarting services with the new code and password"
$COMPOSE build backend celery_worker celery_beat frontend
$COMPOSE up -d --remove-orphans

echo "==> Verifying backend can connect with the new password"
sleep 5
if $COMPOSE exec -T backend python manage.py check --database default; then
  echo "Backend is healthy with the rotated password."
else
  echo "error: backend failed its DB check after rotation." >&2
  echo "The old password is saved in $BACKUP_DIR/root.env if you need to roll back manually." >&2
  exit 1
fi

NEW_PW_FILE="$BACKUP_DIR/new-password.txt"
echo "$NEW_PASSWORD" > "$NEW_PW_FILE"
chmod 600 "$NEW_PW_FILE"

cat <<EOF

Done.
  - Latest code from '$BRANCH' is deployed.
  - The DB password was rotated and written to .env / ovii_backend/.env.
  - New password saved to: $NEW_PW_FILE (store it in a password manager, then delete this file).
  - Old .env backup: $BACKUP_DIR/root.env

EOF
