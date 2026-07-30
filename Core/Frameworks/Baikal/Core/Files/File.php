<?php

namespace Baikal\Core\Files;

class File extends \Sabre\DAVACL\FS\File {
    /** @var HomeStorage */
    private $storage;

    /** @var string */
    private $relativePath;

    public function __construct(HomeStorage $storage, string $relativePath, array $acl, string $owner) {
        $this->storage = $storage;
        $this->relativePath = $relativePath;
        parent::__construct($storage->getPath($relativePath), $acl, $owner);
    }

    public function put($data) {
        return $this->storage->writeFile($this->relativePath, $data, true);
    }

    public function delete() {
        $this->storage->delete($this->relativePath);
    }

    public function setName($name) {
        $position = strrpos($this->relativePath, '/');
        $parent = $position === false ? '' : substr($this->relativePath, 0, $position);
        $newPath = $this->storage->childPath($parent, $name);
        $this->storage->rename($this->relativePath, $newPath);
        $this->relativePath = $newPath;
        $this->path = $this->storage->getPath($newPath);
    }

    public function getETag() {
        return $this->storage->etag($this->relativePath);
    }

    public function getContentType() {
        if (!class_exists('finfo')) {
            return 'application/octet-stream';
        }
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $type = $finfo->file($this->storage->getPath($this->relativePath));

        return is_string($type) && $type !== '' ? $type : 'application/octet-stream';
    }

    public function getHomeStorage(): HomeStorage {
        return $this->storage;
    }

    public function getRelativePath(): string {
        return $this->relativePath;
    }
}
