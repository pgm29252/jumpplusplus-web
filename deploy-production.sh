#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
EXAMPLE_ENV_FILE="$ROOT_DIR/.env.production.example"
LOCAL_BACKEND_ENV_FILE="$ROOT_DIR/backend/.env"
LOCAL_FRONTEND_ENV_FILE="$ROOT_DIR/frontend/.env.local"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
BUILD_FLAG="--build"
FOLLOW_LOGS=false
PRINT_EFFECTIVE_ENV=false

for arg in "$@"; do
  case "$arg" in
    --update)
      BUILD_FLAG="--build"
      ;;
    --no-build)
      BUILD_FLAG=""
      ;;
    --logs)
      FOLLOW_LOGS=true
      ;;
    --print-effective-env)
      PRINT_EFFECTIVE_ENV=true
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./deploy-production.sh [options]

Options:
  --update     Rebuild images and redeploy containers (default behavior)
  --no-build   Start containers without rebuilding images
  --logs       Follow nginx/backend logs after deployment
  --print-effective-env  Print resolved env values before deploy
  -h, --help   Show this help message

Environment:
  ENV_FILE     Path to env file (default: ./.env.production)
USAGE
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown option: $arg"
      echo "Run with --help to see available options."
      exit 1
      ;;
  esac
done

log() {
  printf '\n[INFO] %s\n' "$1"
}

fail() {
  printf '\n[ERROR] %s\n' "$1" >&2
  exit 1
}

mask_secret() {
  local value="$1"
  local len=${#value}
  if [ "$len" -le 6 ]; then
    printf '******'
    return
  fi
  printf '%s******%s' "${value:0:3}" "${value:len-3:3}"
}

read_env_value() {
  local file="$1"
  local key="$2"

  [ -f "$file" ] || return 1

  local raw
  raw="$(grep -E "^${key}=" "$file" | tail -n 1 || true)"
  [ -n "$raw" ] || return 1

  raw="${raw#*=}"
  raw="${raw%\"}"
  raw="${raw#\"}"
  raw="${raw%\'}"
  raw="${raw#\'}"
  printf '%s' "$raw"
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped_value

  escaped_value="$(printf '%s' "$value" | sed 's/[\\&|]/\\&/g')"

  if grep -qE "^${key}=" "$file"; then
    sed -i.bak "s|^${key}=.*|${key}=${escaped_value}|" "$file"
    rm -f "$file.bak"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

fill_if_missing_or_placeholder() {
  local key="$1"
  local replacement="$2"
  local placeholder="$3"

  [ -n "$replacement" ] || return 0

  local current
  current="$(read_env_value "$ENV_FILE" "$key" || true)"

  if [ -z "$current" ] || [ "$current" = "$placeholder" ]; then
    set_env_value "$ENV_FILE" "$key" "$replacement"
    log "Applied local default for ${key}"
  fi
}

apply_local_defaults() {
  local local_jwt_secret=""
  local local_frontend_url=""
  local local_api_url=""
  local local_db_url=""
  local db_user=""
  local db_password=""
  local db_name=""
  local db_creds_host=""
  local db_creds=""
  local db_and_params=""

  if [ -f "$LOCAL_BACKEND_ENV_FILE" ]; then
    local_jwt_secret="$(read_env_value "$LOCAL_BACKEND_ENV_FILE" "JWT_SECRET" || true)"
    local_frontend_url="$(read_env_value "$LOCAL_BACKEND_ENV_FILE" "FRONTEND_URL" || true)"
    local_db_url="$(read_env_value "$LOCAL_BACKEND_ENV_FILE" "DATABASE_URL" || true)"
  fi

  if [ -z "$local_jwt_secret" ] && [ -f "$LOCAL_FRONTEND_ENV_FILE" ]; then
    local_jwt_secret="$(read_env_value "$LOCAL_FRONTEND_ENV_FILE" "JWT_SECRET" || true)"
  fi

  if [ -f "$LOCAL_FRONTEND_ENV_FILE" ]; then
    local_api_url="$(read_env_value "$LOCAL_FRONTEND_ENV_FILE" "NEXT_PUBLIC_API_URL" || true)"
  fi

  fill_if_missing_or_placeholder "JWT_SECRET" "$local_jwt_secret" "change-this-super-secret-jwt"
  fill_if_missing_or_placeholder "FRONTEND_URL" "$local_frontend_url" "http://localhost"
  fill_if_missing_or_placeholder "NEXT_PUBLIC_API_URL" "$local_api_url" "/api"

  if [ -n "$local_db_url" ]; then
    local_db_url="${local_db_url#postgresql://}"
    local_db_url="${local_db_url#postgres://}"

    if [ "$local_db_url" != "${local_db_url#*@}" ]; then
      db_creds_host="${local_db_url%%/*}"
      db_creds="${db_creds_host%%@*}"
      db_and_params="${local_db_url#*/}"

      if [ "$db_creds" != "$db_creds_host" ] && [ "$db_creds" != "" ]; then
        db_user="${db_creds%%:*}"
        db_password="${db_creds#*:}"
      fi

      if [ -n "$db_and_params" ]; then
        db_name="${db_and_params%%\?*}"
      fi
    fi
  fi

  fill_if_missing_or_placeholder "POSTGRES_USER" "$db_user" "jumpplus"
  fill_if_missing_or_placeholder "POSTGRES_PASSWORD" "$db_password" "change-me-strong-password"
  fill_if_missing_or_placeholder "POSTGRES_DB" "$db_name" "jumpplusplus"
}

command -v docker >/dev/null 2>&1 || fail "docker is not installed"
docker compose version >/dev/null 2>&1 || fail "docker compose plugin is not available"

[ -f "$COMPOSE_FILE" ] || fail "docker-compose.yml not found at $COMPOSE_FILE"

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$EXAMPLE_ENV_FILE" ]; then
    log "No .env.production found. Creating from example..."
    cp "$EXAMPLE_ENV_FILE" "$ENV_FILE"
    log "Created $ENV_FILE from example"
  else
    fail "Missing env file: $ENV_FILE"
  fi
fi

apply_local_defaults

# Load env vars from file for validation only.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

[ -n "${POSTGRES_DB:-}" ] || fail "POSTGRES_DB is required in $ENV_FILE"
[ -n "${POSTGRES_USER:-}" ] || fail "POSTGRES_USER is required in $ENV_FILE"
[ -n "${POSTGRES_PASSWORD:-}" ] || fail "POSTGRES_PASSWORD is required in $ENV_FILE"
[ -n "${JWT_SECRET:-}" ] || fail "JWT_SECRET is required in $ENV_FILE"
[ -n "${FRONTEND_URL:-}" ] || fail "FRONTEND_URL is required in $ENV_FILE"
[ -n "${NEXT_PUBLIC_API_URL:-}" ] || fail "NEXT_PUBLIC_API_URL is required in $ENV_FILE"

if [ "${POSTGRES_PASSWORD}" = "change-me-strong-password" ]; then
  fail "POSTGRES_PASSWORD is still a placeholder"
fi

if [ "${JWT_SECRET}" = "change-this-super-secret-jwt" ]; then
  fail "JWT_SECRET is still a placeholder"
fi

if [ "$PRINT_EFFECTIVE_ENV" = true ]; then
  log "Effective environment values"
  printf 'ENV_FILE=%s\n' "$ENV_FILE"
  printf 'POSTGRES_DB=%s\n' "$POSTGRES_DB"
  printf 'POSTGRES_USER=%s\n' "$POSTGRES_USER"
  printf 'POSTGRES_PASSWORD=%s\n' "$(mask_secret "$POSTGRES_PASSWORD")"
  printf 'JWT_SECRET=%s\n' "$(mask_secret "$JWT_SECRET")"
  printf 'FRONTEND_URL=%s\n' "$FRONTEND_URL"
  printf 'NEXT_PUBLIC_API_URL=%s\n' "$NEXT_PUBLIC_API_URL"
  printf 'BUILD_IMAGES=%s\n' "$([ -n "$BUILD_FLAG" ] && echo yes || echo no)"
fi

log "Deploying production stack using $ENV_FILE"
cd "$ROOT_DIR"

docker compose --env-file "$ENV_FILE" up -d ${BUILD_FLAG}

log "Deployment complete. Current status:"
docker compose --env-file "$ENV_FILE" ps

if [ "$FOLLOW_LOGS" = true ]; then
  log "Following nginx and backend logs (Ctrl+C to stop)..."
  docker compose --env-file "$ENV_FILE" logs -f nginx backend
else
  log "Tip: run './deploy-production.sh --logs' to follow logs"
fi
