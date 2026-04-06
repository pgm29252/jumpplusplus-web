#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

REMOVE_VOLUMES=false
REMOVE_IMAGES=false
REMOVE_ENV=false
YES=false

for arg in "$@"; do
  case "$arg" in
    --volumes)
      REMOVE_VOLUMES=true
      ;;
    --images)
      REMOVE_IMAGES=true
      ;;
    --env)
      REMOVE_ENV=true
      ;;
    --all)
      REMOVE_VOLUMES=true
      REMOVE_IMAGES=true
      REMOVE_ENV=true
      ;;
    -y|--yes)
      YES=true
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./destroy-production.sh [options]

Stops and removes all production containers, networks, and optionally
volumes, images, and environment files.

Options:
  --volumes    Also delete persistent Docker volumes (postgres_data, backend_uploads)
  --images     Also remove built Docker images for this project
  --env        Also delete .env.production and .env.production.runtime
  --all        Equivalent to --volumes --images --env
  -y, --yes    Skip confirmation prompt
  -h, --help   Show this help message

Examples:
  ./destroy-production.sh                 # Stop & remove containers/networks only
  ./destroy-production.sh --volumes       # + delete database and upload data
  ./destroy-production.sh --all -y        # Full teardown, no prompt
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

warn() {
  printf '\n[WARN] %s\n' "$1"
}

# ── Confirmation prompt ──────────────────────────────────────────────────────

if [ "$YES" = false ]; then
  echo ""
  echo "============================================"
  echo "  PRODUCTION TEARDOWN"
  echo "============================================"
  echo ""
  echo "  This will:"
  echo "    - Stop and remove all containers"
  echo "    - Remove Docker networks for this project"
  if [ "$REMOVE_VOLUMES" = true ]; then
    warn "  - DELETE ALL PERSISTENT VOLUMES (postgres_data, backend_uploads)"
  fi
  if [ "$REMOVE_IMAGES" = true ]; then
    echo "  - Remove built Docker images"
  fi
  if [ "$REMOVE_ENV" = true ]; then
    warn "  - DELETE .env.production and .env.production.runtime"
  fi
  echo ""
  read -r -p "Are you sure? Type 'yes' to continue: " confirm
  if [ "$confirm" != "yes" ]; then
    echo "[ABORT] Teardown cancelled."
    exit 0
  fi
fi

cd "$ROOT_DIR"

# ── Stop and remove containers + networks ────────────────────────────────────

log "Stopping and removing containers and networks..."

COMPOSE_ARGS=(--file "$COMPOSE_FILE" down --remove-orphans)

if [ "$REMOVE_VOLUMES" = true ]; then
  COMPOSE_ARGS+=(--volumes)
fi

docker compose "${COMPOSE_ARGS[@]}"

log "Containers and networks removed."

# ── Remove built images (optional) ───────────────────────────────────────────

if [ "$REMOVE_IMAGES" = true ]; then
  log "Removing built Docker images..."
  PROJECT_NAME="$(basename "$ROOT_DIR" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]-')"

  # docker compose images outputs image names; remove them if they exist
  IMAGE_IDS="$(docker compose --file "$COMPOSE_FILE" images -q 2>/dev/null || true)"
  if [ -n "$IMAGE_IDS" ]; then
    # shellcheck disable=SC2086
    docker rmi $IMAGE_IDS 2>/dev/null || true
    log "Built images removed."
  else
    # Fallback: try conventional project-prefixed image names
    for svc in backend frontend; do
      IMAGE="${PROJECT_NAME}-${svc}"
      if docker image inspect "$IMAGE" &>/dev/null; then
        docker rmi "$IMAGE" && log "Removed image: $IMAGE"
      fi
    done
  fi
fi

# ── Remove environment files (optional) ──────────────────────────────────────

if [ "$REMOVE_ENV" = true ]; then
  log "Removing environment files..."

  for f in "$ROOT_DIR/.env.production" "$ROOT_DIR/.env.production.runtime"; do
    if [ -f "$f" ]; then
      rm -f "$f"
      log "Deleted: $f"
    fi
  done
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  TEARDOWN COMPLETE"
echo "============================================"
echo ""
echo "  Removed: containers, networks"
[ "$REMOVE_VOLUMES" = true ] && echo "  Removed: Docker volumes (all data deleted)"
[ "$REMOVE_IMAGES" = true ] && echo "  Removed: Docker images"
[ "$REMOVE_ENV" = true ]    && echo "  Removed: .env.production files"
echo ""
echo "  To redeploy, run: ./deploy-production.sh"
echo ""
