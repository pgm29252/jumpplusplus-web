#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="${IMAGE_NAME:-jumpplusplus/frontend:latest}"
NO_CACHE="false"

for arg in "$@"; do
  case "$arg" in
    --no-cache)
      NO_CACHE="true"
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./build-docker.sh [options]

Options:
  --no-cache  Build without using the Docker cache
  -h, --help  Show this help message

Environment:
  IMAGE_NAME          Docker image tag override (default: jumpplusplus/frontend:latest)
  NEXT_PUBLIC_API_URL Build arg for frontend API URL (default: /api)
  JWT_SECRET          Build arg for backend JWT secret default
USAGE
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}"
JWT_SECRET="${JWT_SECRET:-change-this-in-production}"

BUILD_ARGS=(--build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" --build-arg JWT_SECRET="$JWT_SECRET")
DOCKER_ARGS=()
if [ "$NO_CACHE" = "true" ]; then
  DOCKER_ARGS+=(--no-cache)
fi

docker build "${DOCKER_ARGS[@]}" -t "$IMAGE_NAME" "${BUILD_ARGS[@]}" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"
