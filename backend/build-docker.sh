#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_BASE="${IMAGE_BASE:-jumpplusplus/backend}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_NAME="${IMAGE_NAME:-${IMAGE_BASE}:${IMAGE_TAG}}"
NO_CACHE="false"

find_env_file() {
  local candidates=("$ROOT_DIR/.env.production" "$ROOT_DIR/../.env.production")
  for file in "${candidates[@]}"; do
    if [ -f "$file" ]; then
      printf '%s' "$file"
      return 0
    fi
  done
  return 1
}

load_env_file() {
  local file="$1"
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" =~ ^[[:space:]]*# ]] || [[ "$line" =~ ^[[:space:]]*$ ]]; then
      continue
    fi
    if [[ ! "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      continue
    fi
    local key="${line%%=*}"
    local value="${line#*=}"
    value="${value%\"}"
    value="${value#\"}"
    export "$key"="$value"
  done < "$file"
}

ENV_FILE="${ENV_FILE:-$(find_env_file || true)}"
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  load_env_file "$ENV_FILE"
fi

for arg in "$@"; do
  case "$arg" in
    --no-cache)
      NO_CACHE="true"
      ;;
    --tag=* )
      IMAGE_TAG="${arg#*=}"
      ;;
    --tag)
      shift
      IMAGE_TAG="${1:-}"
      if [ -z "$IMAGE_TAG" ]; then
        echo "Missing value for --tag"
        exit 1
      fi
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./build-docker.sh [options]

Options:
  --no-cache  Build without using the Docker cache
  --tag=<tag> Build image with a specific tag
  -h, --help  Show this help message

Environment:
  IMAGE_BASE Docker image base name (default: jumpplusplus/backend)
  IMAGE_TAG  Image tag override (default: latest)
  IMAGE_NAME Full image name override
USAGE
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

if [ -n "$IMAGE_TAG" ]; then
  if [[ "$IMAGE_NAME" == *:* ]]; then
    IMAGE_NAME="${IMAGE_NAME%%:*}:$IMAGE_TAG"
  else
    IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"
  fi
fi

DOCKER_ARGS=()
if [ "$NO_CACHE" = "true" ]; then
  DOCKER_ARGS+=(--no-cache)
fi

docker build "${DOCKER_ARGS[@]}" -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"
