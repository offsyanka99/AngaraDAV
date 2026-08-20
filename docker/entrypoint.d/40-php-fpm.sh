#!/bin/sh
set -e
# Start PHP-FPM (Sury package; PHP_VERSION is set in the image)
PHP_VERSION="${PHP_VERSION:-8.5}"
if [ -x "/etc/init.d/php${PHP_VERSION}-fpm" ]; then
  "/etc/init.d/php${PHP_VERSION}-fpm" start
elif [ -x "/usr/sbin/php-fpm${PHP_VERSION}" ]; then
  "/usr/sbin/php-fpm${PHP_VERSION}" --nodaemonize &
else
  echo "ERROR: php-fpm not found for PHP ${PHP_VERSION}" >&2
  exit 1
fi
