<?php

#################################################################
#  Copyright notice
#
#  (c) 2013 Jérôme Schneider <mail@jeromeschneider.fr>
#  All rights reserved
#
#  http://sabre.io/baikal
#
#  This script is part of the Baïkal Server project. The Baïkal
#  Server project is free software; you can redistribute it
#  and/or modify it under the terms of the GNU General Public
#  License as published by the Free Software Foundation; either
#  version 2 of the License, or (at your option) any later version.
#
#  The GNU General Public License can be found at
#  http://www.gnu.org/copyleft/gpl.html.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  This copyright notice MUST APPEAR in all copies of the script!
#################################################################

namespace Baikal\Model\Config;

class Standard extends \Baikal\Model\Config {
    # Default values
    protected $aData = [
        "configured_version"       => ANGARA_VERSION,
        "timezone"                 => "Europe/Paris",
        "card_enabled"             => true,
        "cal_enabled"              => true,
        "files_enabled"            => false,
        "files_storage_path"       => "",
        "files_max_upload_mb"      => 1024,
        "files_quota_mb"           => 10240,
        "files_quarantine_days"    => 30,
        "tasks_enabled"            => true,
        "notes_enabled"            => false,
        "dav_auth_type"            => "Digest",
        "admin_passwordhash"       => "",
        "failed_access_message"    => "user %u authentication failure for AngaraDAV",
        // While not editable as will change admin & any existing user passwords,
        // could be set to different value when migrating from legacy config
        "auth_realm"               => "BaikalDAV",
        "base_uri"                 => "",
        // Admin UI idle session lifetime (minutes); rolling while active
        "session_max_age_minutes"  => 15,
        // WebDAV-Push (draft-bitfire-webdav-push): server-initiated change
        // notifications over Web Push (RFC 8030/8291/8292) for CalDAV/CardDAV.
        "push_enabled"             => false,
        // WebDAV-Push debug log level -> Specific/push_debug.log
        "push_log_level"           => "off",
        "push_external_url"        => "",
        "push_max_subscriptions_per_principal" => 20,
        "push_max_subscriptions_per_resource"  => 100,
        "push_max_registrations_per_hour"      => 30,
        "push_worker_batch_size"               => 20,
        "push_worker_poll_ms"                  => 2000,
        "push_max_delivery_attempts"           => 5,
    ];

    function __construct() {
        $this->aData["invite_from"] = "noreply@" . $_SERVER['SERVER_NAME']; // Default value

        // Seed the installer default from the container's TZ env var (Docker/TrueNAS),
        // so admins do not have to re-pick a timezone that already matches the host.
        // Only applies when system.timezone is not yet set in baikal.yaml.
        $tz = getenv('TZ');
        if ($tz !== false && $tz !== '' && in_array($tz, \DateTimeZone::listIdentifiers(), true)) {
            $this->aData["timezone"] = $tz;
        }

        parent::__construct("system");
    }

    function label() {
        return "AngaraDAV Settings";
    }

    function set($sProp, $sValue) {
        if ($sProp === "files_max_upload_mb") {
            parent::set($sProp, max(1, min(1048576, (int) $sValue)));

            return $this;
        }

        if ($sProp === "files_quota_mb") {
            // 0 is meaningful ("unlimited"); do not force a minimum of 1 like upload size.
            parent::set($sProp, max(0, min(1073741824, (int) $sValue)));

            return $this;
        }

        if ($sProp === "admin_passwordhash" || $sProp === "admin_passwordhash_confirm") {
            # Special handling for password and passwordconfirm

            if ($sProp === "admin_passwordhash" && $sValue !== "") {
                parent::set(
                    "admin_passwordhash",
                    \Baikal\Core\AdminPassword::hashAdminPassword($sValue, $this->aData["auth_realm"])
                );
            }

            return $this;
        }

        if ($sProp === "session_max_age_minutes") {
            $minutes = max(1, (int) $sValue);
            parent::set($sProp, $minutes);

            return $this;
        }

        $pushIntegerLimits = [
            "push_max_subscriptions_per_principal" => [1, 1000],
            "push_max_subscriptions_per_resource"  => [1, 5000],
            "push_max_registrations_per_hour"      => [1, 1000],
            "push_worker_batch_size"               => [1, 100],
            "push_worker_poll_ms"                  => [250, 10000],
            "push_max_delivery_attempts"           => [1, 10],
        ];
        if (isset($pushIntegerLimits[$sProp])) {
            [$minimum, $maximum] = $pushIntegerLimits[$sProp];
            parent::set($sProp, max($minimum, min($maximum, (int) $sValue)));

            return $this;
        }

        parent::set($sProp, $sValue);
    }

    function get($sProp) {
        if ($sProp === "admin_passwordhash" || $sProp === "admin_passwordhash_confirm") {
            return "";
        }

        return parent::get($sProp);
    }
}
