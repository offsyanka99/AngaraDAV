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

namespace Baikal\Model;

use Symfony\Component\Yaml\Yaml;

abstract class Config extends \Flake\Core\Model\NoDb {
    protected $sConfigFileSection = "";
    protected $aData = [];

    function __construct($sConfigFileSection) {
        # Note: no call to parent::__construct() to avoid erasing $this->aData
        $this->sConfigFileSection = $sConfigFileSection;

        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");
            if (isset($config[$sConfigFileSection])) {
                $aConfig = $config[$sConfigFileSection];
            } else {
                error_log('Section ' . $sConfigFileSection
                        . ' not found in config file. Using default values.');
                $aConfig = [];
            }

            foreach (array_keys($this->aData) as $sProp) {
                if (array_key_exists($sProp, $aConfig)) {
                    $this->aData[$sProp] = $aConfig[$sProp];
                }
            }
        } catch (\Exception $e) {
            error_log('Error reading baikal.yaml file : ' . $e->getMessage());
            // Keep default values in $aData
        }
    }

    protected function getConfigAsString() {
        if (file_exists(PROJECT_PATH_CONFIG . "baikal.yaml")) {
            return Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml")[$this->sConfigFileSection];
        } else {
            return $this->aData;
        }
    }

    function writable() {
        $path = PROJECT_PATH_CONFIG . "baikal.yaml";
        if (@file_exists($path) && @is_file($path)) {
            return @is_writable($path);
        }

        // First install: file does not exist yet; directory must be writable.
        return @is_dir(PROJECT_PATH_CONFIG) && @is_writable(PROJECT_PATH_CONFIG);
    }

    static function icon() {
        return "icon-cog";
    }

    static function mediumicon() {
        return "glyph-cogwheel";
    }

    static function bigicon() {
        return "glyph2x-cogwheel";
    }

    function floating() {
        return false;
    }

    /**
     * Atomically write the full baikal.yaml document.
     *
     * Uses a temp file + rename so a crash mid-write cannot leave a truncated
     * config. Throws on failure so callers do not report "saved" when the
     * volume is read-only or unmounted.
     *
     * @param array<string, mixed> $config
     */
    public static function writeConfigFile(array $config): void {
        if (!defined('PROJECT_PATH_CONFIG') || PROJECT_PATH_CONFIG === '') {
            throw new \RuntimeException('PROJECT_PATH_CONFIG is not defined');
        }
        $dir = PROJECT_PATH_CONFIG;
        if (!is_dir($dir)) {
            throw new \RuntimeException('Config directory does not exist: ' . $dir);
        }
        if (!is_writable($dir)) {
            throw new \RuntimeException('Config directory is not writable by the PHP process (uid ' . (function_exists('posix_geteuid') ? (string) posix_geteuid() : '?') . '). On Docker/TrueNAS, chown the host mount to 101:101: ' . $dir);
        }

        $path = $dir . 'baikal.yaml';
        // Depth 4 keeps system/database keys as nested maps (not one-line dumps).
        $yaml = Yaml::dump($config, 4, 2);
        if ($yaml === '' || $yaml === false) {
            throw new \RuntimeException('Failed to serialize baikal.yaml');
        }

        $tmp = $path . '.tmp.' . getmypid() . '.' . bin2hex(random_bytes(4));
        $written = @file_put_contents($tmp, $yaml, LOCK_EX);
        if ($written === false) {
            @unlink($tmp);
            throw new \RuntimeException('Unable to write temporary config file: ' . $tmp);
        }

        if (!@rename($tmp, $path)) {
            @unlink($tmp);
            throw new \RuntimeException('Unable to replace config file (check mount permissions): ' . $path);
        }
        @chmod($path, 0600);

        // Confirm the file is on disk and parseable — catches full/readonly mounts.
        clearstatcache(true, $path);
        if (!is_readable($path)) {
            throw new \RuntimeException('Config was written but is not readable: ' . $path);
        }
        try {
            Yaml::parseFile($path);
        } catch (\Throwable $e) {
            throw new \RuntimeException('Config write produced unreadable YAML: ' . $e->getMessage(), 0, $e);
        }
    }

    function persist() {
        if (file_exists(PROJECT_PATH_CONFIG . "baikal.yaml")) {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");
            if (!is_array($config)) {
                $config = [];
            }
        } else {
            $config = [];
        }
        $config[$this->sConfigFileSection] = $this->aData;
        self::writeConfigFile($config);
    }

    function destroy() {
    }
}
