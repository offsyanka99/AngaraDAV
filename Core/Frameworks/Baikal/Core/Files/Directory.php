<?php

namespace Baikal\Core\Files;

use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Exception\NotFound;

class Directory extends \Sabre\DAVACL\FS\Collection {
    /** @var HomeStorage */
    private $storage;

    /** @var string */
    private $relativePath;

    /** @var bool */
    private $homeRoot;

    public function __construct(
        HomeStorage $storage,
        string $relativePath,
        array $acl,
        string $owner,
        bool $homeRoot = false
    ) {
        $this->storage = $storage;
        $this->relativePath = $relativePath;
        $this->homeRoot = $homeRoot;
        parent::__construct($storage->getPath($relativePath), $acl, $owner);
    }

    public function getName() {
        if ($this->homeRoot) {
            $position = strrpos($this->owner, '/');

            return $position === false ? $this->owner : substr($this->owner, $position + 1);
        }

        return parent::getName();
    }

    public function createFile($name, $data = null) {
        $childPath = $this->storage->childPath($this->relativePath, $name);

        return $this->storage->writeFile($childPath, $data, false);
    }

    public function createDirectory($name) {
        $this->storage->createDirectory(
            $this->storage->childPath($this->relativePath, $name)
        );
    }

    public function getChild($name) {
        $childPath = $this->storage->childPath($this->relativePath, $name);
        if (!$this->storage->isVisibleChild($childPath)) {
            throw new NotFound('File could not be located');
        }
        $path = $this->storage->getPath($childPath);
        if (is_dir($path)) {
            return new self($this->storage, $childPath, $this->acl, $this->owner);
        }

        return new File($this->storage, $childPath, $this->acl, $this->owner);
    }

    public function childExists($name) {
        try {
            $childPath = $this->storage->childPath($this->relativePath, $name);
        } catch (Forbidden $e) {
            return false;
        }

        return $this->storage->isVisibleChild($childPath);
    }

    public function getChildren() {
        $nodes = [];
        $iterator = new \FilesystemIterator(
            $this->storage->getPath($this->relativePath),
            \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS
        );
        foreach ($iterator as $entry) {
            if ($entry->isLink()) {
                continue;
            }
            $nodes[] = $this->getChild($entry->getFilename());
        }

        return $nodes;
    }

    public function delete() {
        if ($this->homeRoot) {
            throw new Forbidden('A WebDAV file home cannot be deleted');
        }
        $this->storage->delete($this->relativePath);
    }

    public function setName($name) {
        if ($this->homeRoot) {
            throw new Forbidden('A WebDAV file home cannot be renamed');
        }
        $newPath = $this->renamedPath($name);
        $this->storage->rename($this->relativePath, $newPath);
        $this->relativePath = $newPath;
        $this->path = $this->storage->getPath($newPath);
    }

    public function moveInto($targetName, $sourcePath, \Sabre\DAV\INode $sourceNode) {
        if (!$sourceNode instanceof self && !$sourceNode instanceof File) {
            return false;
        }
        if (!$this->storage->sameHome($sourceNode->getHomeStorage())) {
            return false;
        }
        $destination = $this->storage->childPath($this->relativePath, $targetName);
        $this->storage->rename($sourceNode->getRelativePath(), $destination);

        return true;
    }

    public function getQuotaInfo() {
        return $this->storage->quotaInfo();
    }

    public function getHomeStorage(): HomeStorage {
        return $this->storage;
    }

    public function getRelativePath(): string {
        return $this->relativePath;
    }

    private function renamedPath(string $name): string {
        $position = strrpos($this->relativePath, '/');
        $parent = $position === false ? '' : substr($this->relativePath, 0, $position);

        return $this->storage->childPath($parent, $name);
    }
}
