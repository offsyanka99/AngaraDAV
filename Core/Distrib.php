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

/*
 * Product compatibility line (bump when documenting a release).
 * Full BAIKAL_VERSION appends +git.<sha> when a build SHA is available.
 */
define('BAIKAL_VERSION_BASE', '1.0.1');

// Optional image build stamp written by Dockerfile (Core/BuildInfo.php).
if (is_readable(__DIR__ . '/BuildInfo.php')) {
    require_once __DIR__ . '/BuildInfo.php';
}

/**
 * Resolve short git SHA: env → BuildInfo.php → local git (dev only).
 */
function baikal_resolve_git_sha(): string {
    foreach (['BAIKAL_BUILD_GIT', 'GITHUB_SHA'] as $key) {
        $raw = getenv($key);
        if (is_string($raw) && trim($raw) !== '' && strtolower(trim($raw)) !== 'unknown') {
            return baikal_short_git_sha(trim($raw));
        }
    }
    if (defined('BAIKAL_BUILD_GIT')) {
        $built = trim((string) constant('BAIKAL_BUILD_GIT'));
        if ($built !== '' && strtolower($built) !== 'unknown') {
            return baikal_short_git_sha($built);
        }
    }
    // Dev / source installs: read from a checkout when present.
    $gitDir = dirname(__DIR__) . '/.git';
    if (is_dir($gitDir)) {
        $out = @shell_exec('git -C ' . escapeshellarg(dirname(__DIR__)) . ' rev-parse --short=7 HEAD 2>/dev/null');
        if (is_string($out) && preg_match('/^[0-9a-f]{4,40}$/i', trim($out))) {
            return strtolower(trim($out));
        }
    }

    return '';
}

/**
 * @param string $sha full or short hex SHA
 */
function baikal_short_git_sha(string $sha): string {
    $sha = strtolower(preg_replace('/[^0-9a-f]/i', '', $sha) ?? '');
    if ($sha === '') {
        return '';
    }

    return substr($sha, 0, 7);
}

$baikalGit = baikal_resolve_git_sha();
define('BAIKAL_GIT_SHA', $baikalGit);
define(
    'BAIKAL_VERSION',
    $baikalGit !== ''
        ? BAIKAL_VERSION_BASE . '+git.' . $baikalGit
        : BAIKAL_VERSION_BASE
);
define('BAIKAL_HOMEPAGE', 'https://github.com/offsyanka99/AngaraDAV');
