#!/bin/sh
set -eu

ROOT=/var/www/baikal
WORKER="$ROOT/scripts/push-worker.php"

if [ ! -f "$WORKER" ]; then
  exit 0
fi

# Restart the unprivileged worker after transient failures. Exit code 2 means
# permanent configuration failure, so do not create a restart/logging loop.
su -s /bin/sh -c "while true; do /usr/bin/php '$WORKER' >/dev/null 2>&1; status=\$?; [ \$status -eq 2 ] && exit 0; sleep 5; done" nginx &