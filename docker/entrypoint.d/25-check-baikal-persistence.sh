#!/bin/sh
# Warn when config/Specific are not bind-mounted from the host.
# Anonymous Docker volumes look "fine" until the app is recreated — then
# baikal.yaml and the SQLite DB disappear and settings reset to defaults.

ME=$(basename "$0")

check_mount() {
  target="$1"
  label="$2"

  if ! [ -d "$target" ]; then
    echo "$ME: warning: $label path missing: $target"
    return
  fi

  # mountinfo fields: ... root mountpoint ...
  # shellcheck disable=SC2013
  src_line=$(awk -v t="$target" '$5 == t { print; exit }' /proc/self/mountinfo 2>/dev/null || true)
  if [ -z "$src_line" ]; then
    echo "$ME: warning: $label is not a mount ($target)."
    echo "$ME:          Settings written there are stored in the container layer and"
    echo "$ME:          will be lost on recreate. Bind-mount a host dataset, e.g.:"
    echo "$ME:            /mnt/tank/apps/angaradav/config:/var/www/baikal/config"
    return
  fi

  # Field 4 is the path on the device/source; field 9+ have optional fields then FS type.
  # For Docker bind mounts the source usually appears as the host path in field 4 or
  # in the "source" after optional fields. Log a short summary for operators.
  echo "$ME: info: $label mount: $src_line" | head -c 500
  echo

  case "$src_line" in
    *'/docker/volumes/'*|*'/containerd/io.containerd'*|*'/var/lib/kubelet/'*)
      echo "$ME: warning: $label appears to be an anonymous/managed volume, not a host bind path."
      echo "$ME:          On TrueNAS Custom App, set Host Path volumes for both:"
      echo "$ME:            config  → /var/www/baikal/config"
      echo "$ME:            Specific → /var/www/baikal/Specific"
      echo "$ME:          After install, the host should contain baikal.yaml and Specific/db/."
      ;;
  esac

  if [ -n "${BAIKAL_SKIP_CHOWN+x}" ]; then
    # With skip-chown, host ownership must already be nginx (uid 101).
    owner=$(stat -c %u "$target" 2>/dev/null || echo unknown)
    if [ "$owner" != "101" ]; then
      echo "$ME: warning: $label is owned by uid $owner (expected 101) and BAIKAL_SKIP_CHOWN is set."
      echo "$ME:          PHP-FPM runs as nginx and cannot save baikal.yaml. On the host:"
      echo "$ME:            chown -R 101:101 <host-path-for-$label>"
    elif ! [ -w "$target" ]; then
      echo "$ME: warning: $label is not writable (check mode/ACLs on the host path)."
    fi
  fi
}

check_mount /var/www/baikal/config config
check_mount /var/www/baikal/Specific Specific

if [ -f /var/www/baikal/config/baikal.yaml ]; then
  echo "$ME: info: baikal.yaml is present"
else
  echo "$ME: info: baikal.yaml not present yet (complete /portal/install/ once)"
fi

if [ -f /var/www/baikal/Specific/INSTALL_DISABLED ]; then
  echo "$ME: info: install is locked (Specific/INSTALL_DISABLED)"
fi
