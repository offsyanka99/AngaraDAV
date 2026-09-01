#!/bin/sh
# Ensure writable mounts are owned by nginx (uid 101).
#
# Full-tree chown of /var/www/baikal is slow on TrueNAS/bind mounts and can
# look "stuck". Only fix the volume mount points unless ANGARA_SKIP_CHOWN
# (or legacy BAIKAL_SKIP_CHOWN) is set.
#
# Prefer host-side ownership once:
#   chown -R 101:101 /mnt/tank/apps/baikal
# then set ANGARA_SKIP_CHOWN=1 in compose for faster starts.

ME=$(basename "$0")
SKIP_CHOWN=${ANGARA_SKIP_CHOWN:-${BAIKAL_SKIP_CHOWN:-}}

case "$SKIP_CHOWN" in
  1|true|TRUE|yes|YES|on|ON)
    echo "$ME: info: SKIP_CHOWN=${SKIP_CHOWN} — skipping chown"
    exit 0
    ;;
esac

# App files from the image are already owned by nginx. Keep ownership repair
# bounded: a recursive chown through large WebDAV homes can delay every start.
echo "$ME: info: fixing ownership on writable Baikal paths (nginx:nginx)…"
mkdir -p /var/www/baikal/Specific/db \
  /var/www/baikal/Specific/files/homes \
  /var/www/baikal/Specific/files/tmp \
  /var/www/baikal/Specific/files/quarantine \
  /var/www/baikal/Specific/files/locks
chown nginx:nginx /var/www/baikal/config /var/www/baikal/Specific
chown -R nginx:nginx /var/www/baikal/config /var/www/baikal/Specific/db
find /var/www/baikal/Specific -maxdepth 1 -type f -exec chown nginx:nginx {} +
find /var/www/baikal/Specific/files -maxdepth 1 -exec chown nginx:nginx {} +
chmod 0700 /var/www/baikal/Specific/files \
  /var/www/baikal/Specific/files/homes \
  /var/www/baikal/Specific/files/tmp \
  /var/www/baikal/Specific/files/quarantine \
  /var/www/baikal/Specific/files/locks
echo "$ME: info: ownership fix done"
