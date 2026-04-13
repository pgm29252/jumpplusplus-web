#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
STACK_FILE="$ROOT_DIR/docker-stack.yml"
STACK_NAME="${STACK_NAME:-jumpplusplus}"
BACKEND_IMAGE="${BACKEND_IMAGE:-${STACK_NAME}/backend:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-${STACK_NAME}/frontend:latest}"
BUILD=true
NO_CACHE=false
FOLLOW_LOGS=false

for arg in "$@"; do
  case "$arg" in
    --no-build)
      BUILD=false
      ;;
    --update)
      NO_CACHE=true
      ;;
    --logs)
      FOLLOW_LOGS=true
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./deploy-swarm.sh [options]

Options:
  --no-build   Skip rebuilding local images and deploy using existing image tags
  --update     Rebuild images without cache before deploying
  --logs       Follow backend and nginx service logs after deployment
  -h, --help   Show this help message

Environment:
  ENV_FILE    Path to production env file (default: ./.env.production)
  STACK_NAME  Docker stack name (default: jumpplusplus)
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

fail() {
  printf '\n[ERROR] %s\n' "$1" >&2
  exit 1
}

log() {
  printf '\n[INFO] %s\n' "$1"
}

validate_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    fail "$ENV_FILE not found. Copy .env.production.example to .env.production and fill values."
  fi
}

load_env_file() {
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" =~ ^[[:space:]]*# ]] || [[ "$line" =~ ^[[:space:]]*$ ]]; then
      continue
    fi
    if [[ ! "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      fail "Invalid env line in $ENV_FILE: $line"
    fi
    key="${line%%=*}"
    value="${line#*=}"
    export "$key"="$value"
  done < "$ENV_FILE"
}

assert_swarm_active() {
  local swarm_state
  swarm_state="$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || true)"
  if [ "$swarm_state" != "active" ]; then
    fail "Docker Swarm is not active. Run 'docker swarm init' first."
  fi
}

build_images() {
  log "Building backend image: $BACKEND_IMAGE"
  docker build -t "$BACKEND_IMAGE" -f "$ROOT_DIR/backend/Dockerfile" "$ROOT_DIR/backend"

  log "Building frontend image: $FRONTEND_IMAGE"
  docker build -t "$FRONTEND_IMAGE" \
    --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    --build-arg JWT_SECRET="$JWT_SECRET" \
    -f "$ROOT_DIR/frontend/Dockerfile" "$ROOT_DIR/frontend"
}

prepare_build() {
  if [ "$BUILD" = true ]; then
    if [ "$NO_CACHE" = true ]; then
      log "Rebuilding images without cache"
      docker build --no-cache -t "$BACKEND_IMAGE" -f "$ROOT_DIR/backend/Dockerfile" "$ROOT_DIR/backend"
      docker build --no-cache -t "$FRONTEND_IMAGE" \
        --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
        --build-arg JWT_SECRET="$JWT_SECRET" \
        -f "$ROOT_DIR/frontend/Dockerfile" "$ROOT_DIR/frontend"
    else
      build_images
    fi
  else
    log "Skipping image build; using existing tags"
  fi
}

validate_env_file
assert_swarm_active
load_env_file

if [ ! -f "$STACK_FILE" ]; then
  fail "$STACK_FILE not found."
fi

if [ "$BUILD" = true ]; then
  prepare_build
fi

log "Deploying Docker stack: $STACK_NAME"
cd "$ROOT_DIR"
docker stack deploy -c "$STACK_FILE" "$STACK_NAME"

log "Deployment complete. Stack services:"
docker stack services "$STACK_NAME"

if [ "$FOLLOW_LOGS" = true ]; then
  log "Following logs for backend and nginx services (Ctrl+C to stop)"
  docker service logs -f "${STACK_NAME}_backend" "${STACK_NAME}_nginx"
else
  log "Run './deploy-swarm.sh --logs' to follow service logs"
fi
