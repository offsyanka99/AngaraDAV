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

namespace Baikal;

use Symfony\Component\Yaml\Yaml;

class Framework extends \Flake\Core\Framework {
    /**
     * Install/upgrade gate. Browser/DAV contexts redirect to the portal installer.
     * Portal JSON API throws ApiException (503) so the SPA can show a message instead of following HTML 302.
     *
     * @param string $reason machine code: not_configured|upgrade_required|admin_password_missing
     * @param array<string, mixed> $extra extra JSON fields for the portal API
     */
    static function installTool(string $reason = 'not_configured', array $extra = []) {
        if (defined("BAIKAL_CONTEXT_INSTALL") && BAIKAL_CONTEXT_INSTALL === true) {
            # Install tool has been launched and we're already on the install page
            return;
        }

        # Portal JSON API: never emit an HTML Location redirect
        if (defined('BAIKAL_CONTEXT_PORTAL_API') && BAIKAL_CONTEXT_PORTAL_API === true) {
            $product = defined('BAIKAL_VERSION') ? (string) BAIKAL_VERSION : '';
            $productBase = defined('BAIKAL_VERSION_BASE') ? (string) BAIKAL_VERSION_BASE : baikal_version_base($product);
            $payload = array_merge([
                'code'           => $reason,
                'installUrl'     => '/portal/install/',
                'productVersion' => $product,
                'productBase'    => $productBase,
            ], $extra);
            $message = match ($reason) {
                'upgrade_required' => 'Server upgrade required. Open /portal/install/ and complete the upgrade before using the portal.',
                'admin_password_missing' => 'Server setup is incomplete. Open /portal/install/ to finish configuration.',
                default => 'AngaraDAV is not configured yet. Open /portal/install/ to complete setup.',
            };
            throw new \Baikal\Portal\ApiException($message, 503, $payload);
        }

        $sInstallToolUrl = PROJECT_URI . "portal/install/";
        header("Location: " . $sInstallToolUrl);
        exit(0);
    }

    static function bootstrap() {
        # Registering Baikal classloader
        define("BAIKAL_PATH_FRAMEWORKROOT", dirname(__FILE__) . "/");

        \Baikal\Core\Tools::assertEnvironmentIsOk();
        \Baikal\Core\Tools::configureEnvironment();

        # Check that a config file exists
        if (!file_exists(PROJECT_PATH_CONFIG . "baikal.yaml")) {
            self::installTool('not_configured');
        } else {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");
            date_default_timezone_set($config['system']['timezone']);

            # Check that Baïkal is already configured
            if (!isset($config['system']['configured_version']) || trim((string) $config['system']['configured_version']) === '') {
                self::installTool('not_configured');
            } else {
                $configured = (string) $config['system']['configured_version'];
                # Compare version *bases* so +build.sha rebuilds do not force the wizard
                if (function_exists('baikal_needs_upgrade') && baikal_needs_upgrade($configured)) {
                    self::installTool('upgrade_required', [
                        'configuredVersion' => $configured,
                        'configuredBase'    => baikal_version_base($configured),
                    ]);
                } else {
                    # Check that admin password is set
                    if (!$config['system']['admin_passwordhash']) {
                        self::installTool('admin_password_missing', [
                            'configuredVersion' => $configured,
                        ]);
                    }

                    \Baikal\Core\Tools::assertBaikalIsOk();

                    set_error_handler("\Baikal\Framework::exception_error_handler");
                }
            }
        }
    }

    # Mapping PHP errors to exceptions; needed by SabreDAV
    static function exception_error_handler($errno, $errstr, $errfile, $errline) {
        // Respect @-suppression.
        if (!(error_reporting() & $errno)) {
            return false;
        }
        // Notices/deprecations are informational by PHP's own semantics (e.g.
        // web-push's GMP/BCMath recommendation); don't promote them to fatal
        // exceptions, only real warnings/errors.
        static $nonFatal = E_NOTICE | E_USER_NOTICE | E_DEPRECATED | E_USER_DEPRECATED;
        if ($errno & $nonFatal) {
            return false;
        }
        throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
    }
}
