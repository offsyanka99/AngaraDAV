<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Candidate push paths for a file change set, each with the lowest change level
 * it saw: 0 = the path itself was removed, 1 = a direct member changed,
 * 2 = a deeper descendant changed. The worker compares the level with each
 * subscription's content-update depth.
 */
final class FilesPushFanout {
    public const LEVEL_SELF = 0;
    public const LEVEL_MEMBER = 1;
    public const LEVEL_DESCENDANT = 2;

    /**
     * @return array<string, int>
     */
    public static function levels(FilesChangeSet $changes): array {
        $levels = [];
        foreach ($changes->members() as $collection) {
            self::lower($levels, $collection, self::LEVEL_MEMBER);
            foreach (FilesPushPaths::ancestorsUpToHome($collection) as $ancestor) {
                self::lower($levels, $ancestor, self::LEVEL_DESCENDANT);
            }
        }
        foreach ($changes->removedPaths() as $path) {
            self::lower($levels, $path, self::LEVEL_SELF);
        }

        return $levels;
    }

    /**
     * @param array<string, int> $levels
     */
    public static function lower(array &$levels, string $path, int $level): void {
        if (!isset($levels[$path]) || $level < $levels[$path]) {
            $levels[$path] = $level;
        }
    }
}
