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
RUNTIME_ENV_FILE=""

for arg in "$@"; do
  case "$arg" in
    --update)
      BUILD_FLAG="--build --no-cache"
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
  --update     Rebuild images (no cache) and redeploy containers (default behavior)
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

prepare_runtime_env_file() {
  local source_file="$1"
  local runtime_file="$ROOT_DIR/.env.production.runtime"

  : >"$runtime_file"

  local line_no=0
  while IFS= read -r line || [ -n "$line" ]; do
    line_no=$((line_no + 1))

    # Keep comments and empty lines as-is.
    if [[ "$line" =~ ^[[:space:]]*$ ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
      printf '%s\n' "$line" >>"$runtime_file"
      continue
    fi

    # Common accidental Vim command: treat `wq# ...` as comment.
    if [[ "$line" =~ ^[[:space:]]*wq# ]]; then
      printf '#%s\n' "${line#*wq#}" >>"$runtime_file"
      log "Normalized accidental 'wq#' on line ${line_no} in ${source_file}"
      continue
    fi

    # Valid env keys for compose env-file: KEY=VALUE.
    if [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
      printf '%s\n' "$line" >>"$runtime_file"
      continue
    fi

    fail "Invalid env line ${line_no} in ${source_file}: ${line}"
  done <"$source_file"

  RUNTIME_ENV_FILE="$runtime_file"
}

apply_local_defaults() {
  local local_jwt_secret=""
  local local_frontend_url=""
  local local_api_url=""
  local local_db_url=""

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
    fill_if_missing_or_placeholder "DATABASE_URL" "$local_db_url" "postgresql://USER:PASSWORD@your-db-host:5432/jumpplusplus?schema=public"
  fi
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

prepare_runtime_env_file "$ENV_FILE"

POSTGRES_DB_VALUE=""
POSTGRES_USER_VALUE=""
POSTGRES_PASSWORD_VALUE=""
DATABASE_URL_VALUE="$(read_env_value "$RUNTIME_ENV_FILE" "DATABASE_URL" || true)"
JWT_SECRET_VALUE="$(read_env_value "$RUNTIME_ENV_FILE" "JWT_SECRET" || true)"
FRONTEND_URL_VALUE="$(read_env_value "$RUNTIME_ENV_FILE" "FRONTEND_URL" || true)"
NEXT_PUBLIC_API_URL_VALUE="$(read_env_value "$RUNTIME_ENV_FILE" "NEXT_PUBLIC_API_URL" || true)"

[ -n "$DATABASE_URL_VALUE" ] || fail "DATABASE_URL is required in $ENV_FILE"
[ -n "$JWT_SECRET_VALUE" ] || fail "JWT_SECRET is required in $ENV_FILE"
[ -n "$FRONTEND_URL_VALUE" ] || fail "FRONTEND_URL is required in $ENV_FILE"
[ -n "$NEXT_PUBLIC_API_URL_VALUE" ] || fail "NEXT_PUBLIC_API_URL is required in $ENV_FILE"

if [[ "$DATABASE_URL_VALUE" == *"USER:PASSWORD"* ]] || [[ "$DATABASE_URL_VALUE" == *"your-db-host"* ]]; then
  fail "DATABASE_URL is still a placeholder in $ENV_FILE"
fi

if [ "$JWT_SECRET_VALUE" = "change-this-super-secret-jwt" ]; then
  fail "JWT_SECRET is still a placeholder"
fi

if [ "$PRINT_EFFECTIVE_ENV" = true ]; then
  log "Effective environment values"
  printf 'ENV_FILE=%s\n' "$ENV_FILE"
  printf 'DATABASE_URL=%s\n' "$(mask_secret "$DATABASE_URL_VALUE")"
  printf 'JWT_SECRET=%s\n' "$(mask_secret "$JWT_SECRET_VALUE")"
  printf 'FRONTEND_URL=%s\n' "$FRONTEND_URL_VALUE"
  printf 'NEXT_PUBLIC_API_URL=%s\n' "$NEXT_PUBLIC_API_URL_VALUE"
  printf 'BUILD_IMAGES=%s\n' "$([ -n "$BUILD_FLAG" ] && echo yes || echo no)"
fi

log "Deploying production stack using $ENV_FILE"
cd "$ROOT_DIR"

docker compose --env-file "$RUNTIME_ENV_FILE" up -d ${BUILD_FLAG}

log "Deployment complete. Current status:"
docker compose --env-file "$RUNTIME_ENV_FILE" ps

if [ "$FOLLOW_LOGS" = true ]; then
  log "Following nginx and backend logs (Ctrl+C to stop)..."
  docker compose --env-file "$RUNTIME_ENV_FILE" logs -f nginx backend
else
  log "Tip: run './deploy-production.sh --logs' to follow logs"
fi
