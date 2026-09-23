#!/bin/sh
set -eu

ROOT=/var/www/baikal
SCRIPT="$ROOT/scripts/files-maintenance.php"

if [ ! -f "$SCRIPT" ]; then
  exit 0
fi

# Periodically purge quarantined file homes and stale upload temp files.
# The script itself no-ops (exit 0) when Files is disabled/unprovisioned and
# self-locks against overlapping runs, so a fixed interval loop is safe.
INTERVAL="${ANGARA_FILES_MAINTENANCE_INTERVAL_SECONDS:-3600}"
case "$INTERVAL" in
  ''|*[!0-9]*) INTERVAL=3600 ;;
esac

su -s /bin/sh -c "while true; do sleep '$INTERVAL'; /usr/bin/php '$SCRIPT' >/dev/null 2>&1 || true; done" nginx &
