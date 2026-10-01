<?php

namespace Baikal\Core\Plugins\Push;

/**
 * File-home changes collected during one request, shared by DAV and portal writes.
 * Paths outside a file home are ignored.
 */
final class FilesChangeSet {
    /** @var array<string, true> */
    private $members = [];

    /** @var array<string, true> */
    private $removed = [];

    /**
     * A direct member of $collection was added, changed, renamed, or removed.
     */
    public function member(string $collection): void {
        $collection = trim($collection, '/');
        if (FilesPushPaths::homeRoot($collection) !== null) {
            $this->members[$collection] = true;
        }
    }

    /**
     * $path (file or directory) no longer exists at that path.
     */
    public function removed(string $path): void {
        $path = trim($path, '/');
        if (FilesPushPaths::homeRoot($path) !== null) {
            $this->removed[$path] = true;
        }
    }

    /**
     * @return list<string>
     */
    public function members(): array {
        return array_map('strval', array_keys($this->members));
    }

    /**
     * @return list<string>
     */
    public function removedPaths(): array {
        return array_map('strval', array_keys($this->removed));
    }

    public function isEmpty(): bool {
        return $this->members === [] && $this->removed === [];
    }
}
