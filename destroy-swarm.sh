#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_NAME="${STACK_NAME:-jumpplusplus}"
REMOVE_VOLUMES=false
YES=false

for arg in "$@"; do
  case "$arg" in
    --volumes)
      REMOVE_VOLUMES=true
      ;;
    -y|--yes)
      YES=true
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./destroy-swarm.sh [options]

Options:
  --volumes  Remove the backend_uploads volume after stack removal
  -y, --yes  Skip confirmation prompt
  -h, --help Show this help message

Environment:
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

if [ "$YES" = false ]; then
  echo ""
  echo "This will remove the Docker Swarm stack: $STACK_NAME"
  if [ "$REMOVE_VOLUMES" = true ]; then
    echo "  - Also remove named volume: ${STACK_NAME}_backend_uploads"
  fi
  echo ""
  read -r -p "Continue? Type 'yes' to confirm: " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
  fi
fi

log() {
  printf '\n[INFO] %s\n' "$1"
}

log "Removing Docker stack: $STACK_NAME"
docker stack rm "$STACK_NAME"

if [ "$REMOVE_VOLUMES" = true ]; then
  local_volume="${STACK_NAME}_backend_uploads"
  if docker volume inspect "$local_volume" >/dev/null 2>&1; then
    log "Removing volume: $local_volume"
    docker volume rm "$local_volume"
  else
    log "Volume not found: $local_volume"
  fi
fi

log "Stack removal initiated. Verify with 'docker stack ls' and 'docker stack services $STACK_NAME'"
