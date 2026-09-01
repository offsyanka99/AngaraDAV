#!/bin/sh

set -eu

ME=$(basename "$0")
LIMIT=${ANGARA_DAV_MAX_BODY_SIZE:-${BAIKAL_DAV_MAX_BODY_SIZE:-1G}}

if ! printf '%s' "$LIMIT" | grep -Eq '^[1-9][0-9]*[kKmMgG]?$'; then
  echo "$ME: error: ANGARA_DAV_MAX_BODY_SIZE must be a positive nginx size such as 512M or 2G" >&2
  exit 1
fi

# Apply to every marker (DAV + portal /api/ body size)
sed -i -E \
  "s/(client_max_body_size )[1-9][0-9]*[kKmMgG]?;( # BAIKAL_DAV_UPLOAD_LIMIT)/\1${LIMIT};\2/" \
  /etc/nginx/conf.d/default.conf

echo "$ME: info: DAV and portal API request-body limit set to $LIMIT"