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

use Symfony\Component\Yaml\Yaml;

class Standard extends \Baikal\Model\Config {
    # Default values
    protected $aData = [
        "configured_version"       => BAIKAL_VERSION,
        "timezone"                 => "Europe/Paris",
        "card_enabled"             => true,
        "cal_enabled"              => true,
        "files_enabled"            => false,
        "files_storage_path"       => "",
        "files_max_upload_bytes"   => 1073741824,
        "files_quota_bytes"        => 10737418240,
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

    function formMorphologyForThisModelInstance() {
        $oMorpho = new \Formal\Form\Morphology();

        $oMorpho->add(new \Formal\Element\Listbox([
            "prop"       => "timezone",
            "label"      => "Server Time zone",
            "validation" => "required",
            "options"    => \Baikal\Core\Tools::timezones(),
        ]));

        $oMorpho->add(new \Formal\Element\Checkbox([
            "prop"  => "card_enabled",
            "label" => "Enable CardDAV",
        ]));

        $oMorpho->add(new \Formal\Element\Checkbox([
            "prop"  => "cal_enabled",
            "label" => "Enable CalDAV",
        ]));

        $oMorpho->add(new \Formal\Element\Checkbox([
            "prop"  => "files_enabled",
            "label" => "Enable WebDAV file storage",
            "help"  => "Private per-user file homes under /dav.php/files/. Use only over HTTPS.",
        ]));

        $oMorpho->add(new \Formal\Element\Text([
            "prop"  => "files_storage_path",
            "label" => "WebDAV file storage path",
            "help"  => "Absolute path outside the web root. Leave empty for Specific/files.",
        ]));

        $oMorpho->add(new \Formal\Element\Text([
            "prop"       => "files_max_upload_bytes",
            "label"      => "Maximum WebDAV file size (bytes)",
            "validation" => "required",
        ]));

        $oMorpho->add(new \Formal\Element\Text([
            "prop"       => "files_quota_bytes",
            "label"      => "WebDAV quota per user (bytes)",
            "validation" => "required",
            "help"       => "Use 0 for unlimited application quota. Filesystem quotas are still recommended.",
        ]));

        $oMorpho->add(new \Formal\Element\Text([
            "prop"       => "files_quarantine_days",
            "label"      => "Deleted user file retention (days)",
            "validation" => "required",
        ]));

        $oMorpho->add(new \Formal\Element\Checkbox([
            "prop"  => "tasks_enabled",
            "label" => "Enable Tasks (VTODO)",
            "help"  => "When enabled, new calendars can include tasks and the default calendar gets VTODO. Requires CalDAV.",
        ]));

        $oMorpho->add(new \Formal\Element\Checkbox([
            "prop"  => "notes_enabled",
            "label" => "Enable Notes (VJOURNAL)",
            "help"  => "When enabled, calendars may store notes as VJOURNAL. Client support is limited. Requires CalDAV.",
        ]));

        $oMorpho->add(new \Formal\Element\Text([
            "prop"  => "invite_from",
            "label" => "Email invite sender address",
            "help"  => "Leave empty to disable sending invite emails",
        ]));

        $oMorpho->add(new \Formal\Element\Listbox([
            "prop"    => "dav_auth_type",
            "label"   => "WebDAV authentication type",
            "options" => ["Digest", "Basic", "Apache"],
            "help"    => "Digest uses MD5 password hashes (protocol design). Prefer Basic over HTTPS. Apache uses web-server auth.",
        ]));

        $oMorpho->add(new \Formal\Element\Text([
            "prop"       => "session_max_age_minutes",
            "label"      => "Admin session timeout (minutes)",
            "validation" => "required",
            "help"       => "Idle lifetime for the admin web UI. Session is refreshed while you use the UI.",
        ]));

        $oMorpho->add(new \Formal\Element\Checkbox([
            "prop"  => "push_enabled",
            "label" => "Enable WebDAV-Push",
            "help"  => "Server-initiated change notifications (Web Push) for CalDAV/CardDAV clients such as DAVx\u{2075}. Requires the minishlink/web-push library and the openssl PHP extension.",
        ]));

        $oMorpho->add(new \Formal\Element\Text([
            "prop"  => "push_external_url",
            "label" => "WebDAV-Push external URL",
            "help"  => "Canonical HTTPS DAV base URL, for example https://dav.example.com/dav.php/. Required when WebDAV-Push is enabled; proxy headers are never trusted.",
        ]));

        $oMorpho->add(new \Formal\Element\Listbox([
            "prop"    => "push_log_level",
            "label"   => "WebDAV-Push debug log level",
            "options" => ["off", "error", "warn", "info", "debug"],
            "help"    => "Writes to Specific/push_debug.log. Keep 'off' in production; use 'debug' only while troubleshooting.",
        ]));

        $oMorpho->add(new \Formal\Element\Password([
            "prop"  => "admin_passwordhash",
            "label" => "Admin password",
        ]));

        $oMorpho->add(new \Formal\Element\Password([
            "prop"       => "admin_passwordhash_confirm",
            "label"      => "Admin password, confirmation",
            "validation" => "sameas:admin_passwordhash",
        ]));

        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");
        } catch (\Exception $e) {
            error_log('Error reading baikal.yaml file : ' . $e->getMessage());
        }

        if (!isset($config['system']["admin_passwordhash"]) || trim($config['system']["admin_passwordhash"]) === "") {
            # No password set (Form is used in install tool), so password is required as it has to be defined
            $oMorpho->element("admin_passwordhash")->setOption("validation", "required");
        } else {
            $sNotice = "-- Leave empty to keep current password --";
            $oMorpho->element("admin_passwordhash")->setOption("placeholder", $sNotice);
            $oMorpho->element("admin_passwordhash_confirm")->setOption("placeholder", $sNotice);
        }

        return $oMorpho;
    }

    function label() {
        return "AngaraDAV Settings";
    }

    function set($sProp, $sValue) {
        if ($sProp === "admin_passwordhash" || $sProp === "admin_passwordhash_confirm") {
            # Special handling for password and passwordconfirm

            if ($sProp === "admin_passwordhash" && $sValue !== "") {
                parent::set(
                    "admin_passwordhash",
                    \BaikalAdmin\Core\Auth::hashAdminPassword($sValue, $this->aData["auth_realm"])
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
