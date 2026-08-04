# AngaraDAV - multi-stage image built from this repository.
# Local:  docker build -t angaradav:local .
# GHCR:   ghcr.io/offsyanka99/angaradav:<tag>

# ---------------------------------------------------------------------------
# Stage 1: install PHP dependencies from composer.lock (reproducible)
# ---------------------------------------------------------------------------
FROM composer:2 AS builder

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
RUN ln -sfn ../../Frameworks/Baikal/Resources Core/Resources/Web/Baikal \
    && ln -sfn ../../Frameworks/BaikalAdmin/Resources Core/Resources/Web/BaikalAdmin \
    && ln -sfn ../../Frameworks/TwitterBootstrap Core/Resources/Web/TwitterBootstrap \
    && ln -sfn ../Core/Frameworks/Baikal/WWWRoot/index.php html/index.php \
    && ln -sfn ../../Core/Frameworks/BaikalAdmin/WWWRoot/index.php html/admin/index.php \
    && ln -sfn ../../../Core/Frameworks/BaikalAdmin/WWWRoot/install/index.php html/admin/install/index.php \
    && ln -sfn ../../Core/Resources/Web html/res/core

RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader \
    && sh scripts/apply-vendor-patches.sh \
    && rm -f composer.json composer.lock

# ---------------------------------------------------------------------------
# Stage 2: TypeScript user portal SPA → /html/portal
# ---------------------------------------------------------------------------
FROM node:22-alpine AS portal

WORKDIR /build/portal
COPY portal/package.json portal/package-lock.json* ./
RUN npm install
COPY portal/ ./
# vite.config outDir is ../html/portal → /build/html/portal
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: nginx + PHP-FPM runtime
# ---------------------------------------------------------------------------
FROM nginx:1

# Injected by CI (github.sha). Local builds: docker build --build-arg GIT_SHA=$(git rev-parse HEAD)
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown

RUN curl -fsSL -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg \
    && apt-get update \
    && apt-get install -y --no-install-recommends lsb-release ca-certificates \
    && echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" \
         > /etc/apt/sources.list.d/php.list \
    && apt-get remove -y lsb-release \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
         php8.2-cli \
         php8.2-curl \
         php8.2-fpm \
         php8.2-gd \
         php8.2-gmp \
         php8.2-mbstring \
         php8.2-pgsql \
         php8.2-sqlite3 \
         php8.2-xml \
         sqlite3 \
         msmtp \
         msmtp-mta \
         curl \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i 's/www-data/nginx/g' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's|^listen = .*|listen = /var/run/php-fpm.sock|' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's/^;listen.owner = .*/listen.owner = nginx/' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's/^;listen.group = .*/listen.group = nginx/' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's/;clear_env = no/clear_env = no/' /etc/php/8.2/fpm/pool.d/www.conf \
    # Portal multipart + DAV uploads: PHP default upload_max_filesize is 2M and
    # rejects larger files before FileService runs (UI shows app max ~1G).
    && printf '%s\n' \
         '; AngaraDAV — align with system.files_max_upload_bytes default (1 GiB)' \
         'upload_max_filesize = 1G' \
         'post_max_size = 1G' \
         'max_file_uploads = 50' \
         > /etc/php/8.2/fpm/conf.d/99-angaradav-uploads.ini \
    && cp /etc/php/8.2/fpm/conf.d/99-angaradav-uploads.ini \
         /etc/php/8.2/cli/conf.d/99-angaradav-uploads.ini

COPY --from=builder --chown=nginx:nginx /src /var/www/baikal
COPY --from=portal --chown=nginx:nginx /build/html/portal /var/www/baikal/html/portal

# Persist short git SHA for BAIKAL_VERSION (…+git.<sha>) and /health.php / portal footer.
RUN SHORT="$(printf '%s' "${GIT_SHA}" | tr -cd '0-9a-fA-F' | cut -c1-7)"; \
    if [ -z "${SHORT}" ] || [ "${SHORT}" = "unknown" ]; then SHORT="unknown"; fi; \
    printf '%s\n' \
      '<?php' \
      '// Generated at image build — do not edit.' \
      "define('BAIKAL_BUILD_GIT', '${SHORT}');" \
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
COPY docker/entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh

VOLUME ["/var/www/baikal/config", "/var/www/baikal/Specific"]

EXPOSE 80
# nginx image entrypoint runs /docker-entrypoint.d then nginx
