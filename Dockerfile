# AngaraDAV - multi-stage image built from this repository.
# Local:  docker build -t angaradav:local .
# GHCR:   ghcr.io/offsyanka99/angaradav:<tag>

# ---------------------------------------------------------------------------
# Stage 1: install PHP dependencies from composer.lock (reproducible)
# ---------------------------------------------------------------------------
FROM composer:2.10.2 AS builder

# `patch` is required by scripts/apply-vendor-patches.sh (post-install + explicit run)
RUN apk add --no-cache patch

WORKDIR /src

COPY composer.json composer.lock ./
COPY Core ./Core
COPY html ./html
COPY LICENSE SECURITY.md ./
# Vendor patches (e.g. dual-format calendar-timezone for Home Assistant)
COPY patches ./patches
COPY scripts/apply-vendor-patches.sh ./scripts/apply-vendor-patches.sh
COPY scripts/push-worker.php scripts/files-maintenance.php ./scripts/

# Git may materialize symlinks as one-line text files on Windows. Normalize the
# tracked web/resource links so local Docker builds match Linux CI builds.
# Formal admin UI is gone: html/admin/*.php are portal redirects (keep as files).
RUN ln -sfn ../../Core/Resources/Web html/res/core \
    && mkdir -p html/admin/install \
    && cp -f Core/Frameworks/BaikalAdmin/WWWRoot/index.php html/admin/index.php \
    && cp -f Core/Frameworks/BaikalAdmin/WWWRoot/install/index.php html/admin/install/index.php

# Packagist/GitHub zipballs occasionally 504; retry before failing the image build.
RUN set -eux; \
    n=0; \
    until [ "$n" -ge 5 ]; do \
      composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader && break; \
      n=$((n + 1)); \
      echo "composer install failed (attempt $n), retrying..."; \
      sleep $((n * 15)); \
    done; \
    [ "$n" -lt 5 ]; \
    sh scripts/apply-vendor-patches.sh; \
    rm -f composer.json composer.lock

# ---------------------------------------------------------------------------
# Stage 2: TypeScript user portal SPA → /html/portal
# ---------------------------------------------------------------------------
FROM node:24-alpine AS portal

WORKDIR /build/portal
COPY portal/package.json portal/package-lock.json* ./
RUN npm install
COPY portal/ ./
# vite.config outDir is ../html/portal → /build/html/portal
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: nginx + PHP-FPM runtime
# ---------------------------------------------------------------------------
FROM nginx:1.31.3-trixie

# Injected by CI (github.sha). Local builds: docker build --build-arg GIT_SHA=$(git rev-parse HEAD)
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ARG PHP_VERSION=8.5
ENV PHP_VERSION=${PHP_VERSION}

RUN curl -fsSL -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg \
    && apt-get update \
    && apt-get install -y --no-install-recommends lsb-release ca-certificates \
    && echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" \
         > /etc/apt/sources.list.d/php.list \
    && apt-get remove -y lsb-release \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
         php${PHP_VERSION}-cli \
         php${PHP_VERSION}-curl \
         php${PHP_VERSION}-fpm \
         php${PHP_VERSION}-gd \
         php${PHP_VERSION}-gmp \
         php${PHP_VERSION}-mbstring \
         php${PHP_VERSION}-pgsql \
         php${PHP_VERSION}-sqlite3 \
         php${PHP_VERSION}-xml \
         sqlite3 \
         msmtp \
         msmtp-mta \
         curl \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i 's/www-data/nginx/g' /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf \
    && sed -i 's|^listen = .*|listen = /var/run/php-fpm.sock|' /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf \
    && sed -i 's/^;listen.owner = .*/listen.owner = nginx/' /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf \
    && sed -i 's/^;listen.group = .*/listen.group = nginx/' /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf \
    && sed -i 's/;clear_env = no/clear_env = no/' /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf \
    # Portal multipart + DAV uploads: PHP default upload_max_filesize is 2M and
    # rejects larger files before FileService runs (UI shows app max ~1G).
    && printf '%s\n' \
         '; AngaraDAV — align with system.files_max_upload_mb default (1024 MB)' \
         'upload_max_filesize = 1G' \
         'post_max_size = 1G' \
         'max_file_uploads = 50' \
         > /etc/php/${PHP_VERSION}/fpm/conf.d/99-angaradav-uploads.ini \
    && cp /etc/php/${PHP_VERSION}/fpm/conf.d/99-angaradav-uploads.ini \
         /etc/php/${PHP_VERSION}/cli/conf.d/99-angaradav-uploads.ini

COPY --from=builder --chown=nginx:nginx /src /var/www/baikal
COPY --from=portal --chown=nginx:nginx /build/html/portal /var/www/baikal/html/portal

# Persist short git SHA for ANGARA_VERSION (…+git.<sha>) and /health.php / portal footer.
RUN SHORT="$(printf '%s' "${GIT_SHA}" | tr -cd '0-9a-fA-F' | cut -c1-7)"; \
    if [ -z "${SHORT}" ] || [ "${SHORT}" = "unknown" ]; then SHORT="unknown"; fi; \
    printf '%s\n' \
      '<?php' \
      '// Generated at image build — do not edit.' \
    "define('ANGARA_BUILD_GIT', '${SHORT}');" \
      "define('BAIKAL_BUILD_TIME', '${BUILD_TIME}');" \
      > /var/www/baikal/Core/BuildInfo.php \
    && chown nginx:nginx /var/www/baikal/Core/BuildInfo.php

RUN mkdir -p /var/www/baikal/config \
        /var/www/baikal/Specific/db \
        /var/www/baikal/Specific/files/homes \
        /var/www/baikal/Specific/files/tmp \
        /var/www/baikal/Specific/files/quarantine \
        /var/www/baikal/Specific/files/locks \
    && chmod 0700 /var/www/baikal/Specific/files \
        /var/www/baikal/Specific/files/homes \
        /var/www/baikal/Specific/files/tmp \
        /var/www/baikal/Specific/files/quarantine \
        /var/www/baikal/Specific/files/locks \
    && chown -R nginx:nginx /var/www/baikal

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx-security-headers.inc /etc/nginx/security-headers.inc
COPY docker/entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh

VOLUME ["/var/www/baikal/config", "/var/www/baikal/Specific"]

EXPOSE 80
# nginx image entrypoint runs /docker-entrypoint.d then nginx
