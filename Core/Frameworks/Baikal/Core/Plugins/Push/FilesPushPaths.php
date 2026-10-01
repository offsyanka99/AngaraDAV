<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Pure helpers for decoded Sabre tree paths under files/{user}.
 *
 * Paths are never rawurldecode()d here: file names may legitimately contain '%'.
 */
final class FilesPushPaths {
    public const ROOT = 'files';

    public static function isFilesPath(string $path): bool {
        $norm = trim($path, '/');

        return $norm === self::ROOT || str_starts_with($norm, self::ROOT . '/');
    }

    /**
     * files/{user} for any path at or below a file home, otherwise null.
     */
    public static function homeRoot(string $path): ?string {
        $parts = explode('/', trim($path, '/'), 3);
        if (count($parts) < 2 || $parts[0] !== self::ROOT || $parts[1] === '') {
            return null;
        }

        return $parts[0] . '/' . $parts[1];
    }

    public static function parent(string $path): ?string {
        $norm = trim($path, '/');
        $position = strrpos($norm, '/');

        return $position === false ? null : substr($norm, 0, $position);
    }

    /**
     * Strict ancestors of $path, nearest first, ending at its home root.
     *
     * @return list<string>
     */
    public static function ancestorsUpToHome(string $path): array {
        $home = self::homeRoot($path);
        if ($home === null) {
            return [];
        }
        $ancestors = [];
        $current = trim($path, '/');
        while ($current !== $home) {
            $current = (string) self::parent($current);
            $ancestors[] = $current;
        }

        return $ancestors;
    }
}
