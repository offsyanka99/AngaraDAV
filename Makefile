.PHONY: dist portal php-test local-build local-up local-down local-logs clean help build-assets

# Zip layout used to be build/baikal + baikal-$(VERSION).zip (Baïkal leftover).
BUILD_DIR=build/angaradav
BUILD_FILES=Core html LICENSE README.md composer.json
VERSION=$(shell php -r "include 'Core/Distrib.php'; echo BAIKAL_VERSION;")

help:
	@echo "AngaraDAV $(VERSION)"
	@echo "  make dist         Zip source tree to build/angaradav-$(VERSION).zip"
	@echo "  make portal       Typecheck + test + Vite build (portal/)"
	@echo "  make php-test     Run tests/php/*.php"
	@echo "  make local-up     Build and start angaradav-local on :31088"
	@echo "  make local-down   Stop the local container"
	@echo "  make local-logs   Follow local container logs"
	@echo "  make clean        Remove install artifacts in config/ + Specific/db"

dist: vendor/autoload.php
	# Building AngaraDAV $(VERSION)
	rm -rf $(BUILD_DIR)
	mkdir -p $(BUILD_DIR) $(BUILD_DIR)/Specific $(BUILD_DIR)/Specific/db $(BUILD_DIR)/config
	touch $(BUILD_DIR)/Specific/db/.empty
	touch $(BUILD_DIR)/config/.empty
	rsync -av \
		$(BUILD_FILES) \
		--exclude="*.swp" \
		$(BUILD_DIR)
	composer config platform.php 8.2 -d $(BUILD_DIR)
	composer install --no-interaction --no-dev -d $(BUILD_DIR)
	rm $(BUILD_DIR)/composer.*
	cd build && zip -r angaradav-$(VERSION).zip angaradav/

# Sabre example SQL concatenated for the SQLite schema snapshot in-tree.
build-assets: vendor/autoload.php
	cat vendor/sabre/dav/examples/sql/sqlite.*.sql > Core/Resources/Db/SQLite/db.sql

portal:
	cd portal && npm test && npm run build

php-test: vendor/autoload.php
	@set -e; \
	for t in tests/php/*.php; do \
	  echo "== $$t"; \
	  php $$t; \
	done

local-build:
	sh scripts/local-docker.sh build

local-up:
	sh scripts/local-docker.sh up

local-down:
	sh scripts/local-docker.sh down

local-logs:
	sh scripts/local-docker.sh logs

vendor/autoload.php: composer.lock
	composer install --no-interaction

composer.lock: composer.json
	composer update --no-interaction

clean:
	# Wipe local install data (not .local-run Docker binds)
	rm -f config/baikal.yaml Specific/db/db.sqlite Specific/INSTALL_DISABLED
