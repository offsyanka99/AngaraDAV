#!/bin/sh
# Local AngaraDAV container. Prefers Compose v2 (`docker compose`), then
# `docker-compose`, then plain `docker build` + `docker run`.
set -e
ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"
COMPOSE_FILE="$ROOT/docs/local.compose.yaml"
IMAGE="${ANGARADAV_IMAGE:-angaradav:local}"
NAME="${ANGARADAV_CONTAINER:-angaradav-local}"
GIT_SHA="${GIT_SHA:-local}"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
    return 0
  fi
  return 1
}

need_dirs() {
  mkdir -p "$ROOT/.local-run/config" "$ROOT/.local-run/Specific/db"
}

plain_build() {
  docker build -t "$IMAGE" --build-arg "GIT_SHA=$GIT_SHA" -f "$ROOT/Dockerfile" "$ROOT"
}

plain_up() {
  need_dirs
  plain_build
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" --restart unless-stopped \
    -p 31088:80 \
    -e TZ=UTC \
    -v "$ROOT/.local-run/config:/var/www/baikal/config" \
    -v "$ROOT/.local-run/Specific:/var/www/baikal/Specific" \
    "$IMAGE"
}

plain_down() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
}

plain_logs() {
  docker logs -f "$NAME"
}

cmd=${1:-up}
case "$cmd" in
  build)
    if ! compose build; then
      echo "scripts/local-docker.sh: Compose not installed; using docker build" >&2
      echo "  optional: sudo apt install docker-compose-v2" >&2
      plain_build
    fi
    ;;
  up)
    need_dirs
    if compose up --build -d; then
      :
    else
      echo "scripts/local-docker.sh: Compose not installed; using docker build/run" >&2
      echo "  optional: sudo apt install docker-compose-v2" >&2
      echo "  (container name $NAME, image $IMAGE — not 'angaradav')" >&2
      plain_up
    fi
    echo "Portal:  http://127.0.0.1:31088/portal/"
    echo "Install: http://127.0.0.1:31088/portal/install/"
    echo "Container $NAME (image $IMAGE)."
    ;;
  down)
    if ! compose down; then
      plain_down
    fi
    ;;
  logs)
    if ! compose logs -f; then
      plain_logs
    fi
    ;;
  *)
    echo "Usage: $0 {up|down|build|logs}" >&2
    exit 2
    ;;
esac
