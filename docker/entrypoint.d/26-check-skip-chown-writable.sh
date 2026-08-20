#!/bin/sh
# If BAIKAL_SKIP_CHOWN is set, config/ and Specific/ must already be writable
# by nginx (uid 101). Warn-only used to leave the installer as the only hint;
# fail here so the container does not come up unable to save baikal.yaml.
set -e

ME=$(basename "$0")

# Only 1/true/yes/on skip chown. Unset, empty, 0, false, no → chown as usual.
case "${BAIKAL_SKIP_CHOWN:-}" in
  1|true|TRUE|yes|YES|on|ON) ;;
  *) exit 0 ;;
esac

NGINX_USER=nginx
if ! id -u "$NGINX_USER" >/dev/null 2>&1; then
  echo "$ME: error: BAIKAL_SKIP_CHOWN is set but user '$NGINX_USER' is missing" >&2
  exit 1
fi

fail() {
  echo "$ME: error: $1" >&2
  echo "$ME: error: BAIKAL_SKIP_CHOWN=1 skips the entrypoint chown." >&2
  echo "$ME: error: On the host, fix ownership then recreate the container:" >&2
  echo "$ME: error:   chown -R 101:101 <host-path-for-config-and-Specific>" >&2
  echo "$ME: error:   docker compose … up -d --force-recreate" >&2
  echo "$ME: error: Or unset BAIKAL_SKIP_CHOWN and let 40-fix-baikal-file-permissions.sh chown." >&2
  exit 1
}

check_writable_by_nginx() {
  target="$1"
  label="$2"

  if ! [ -d "$target" ]; then
    fail "$label path missing: $target"
  fi

  owner=$(stat -c %u "$target" 2>/dev/null || echo unknown)
  if [ "$owner" != "101" ]; then
    fail "$label is owned by uid $owner (expected 101 / nginx) and BAIKAL_SKIP_CHOWN is set"
  fi

  if ! su -s /bin/sh "$NGINX_USER" -c "test -w '$target'"; then
    fail "$label is not writable by nginx (uid 101); check mode/ACLs on the host path"
  fi

  echo "$ME: info: $label is writable by nginx (uid 101)"
}

check_writable_by_nginx /var/www/baikal/config config
check_writable_by_nginx /var/www/baikal/Specific Specific
