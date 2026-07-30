<?php

namespace Baikal\Core\Files;

use Sabre\DAVACL\AbstractPrincipalCollection;
use Sabre\DAVACL\ACLTrait;
use Sabre\DAVACL\IACL;
use Sabre\DAVACL\PrincipalBackend\BackendInterface;

/**
 * Non-enumerable owner-only file homes for DAV principals.
 */
class HomeCollection extends AbstractPrincipalCollection implements IACL {
    use ACLTrait;

    /** @var HomeRepository */
    private $repository;

    /** @var FileStorageConfig */
    private $config;

    public function __construct(
        BackendInterface $principalBackend,
        HomeRepository $repository,
        FileStorageConfig $config
    ) {
        parent::__construct($principalBackend, 'principals');
        $this->repository = $repository;
        $this->config = $config;
        $this->disableListing = true;
    }

    public function getName() {
        return 'files';
    }

    public function getChildForPrincipal(array $principalInfo) {
        $owner = (string) $principalInfo['uri'];
        $home = $this->repository->getOrCreateForPrincipal($owner);
        $storage = new HomeStorage($this->config, (string) $home['storage_id']);

        return new Directory($storage, '', self::ownerAcl(), $owner, true);
    }

    public function getACL() {
        return [
            [
                'principal' => '{DAV:}authenticated',
                'privilege' => '{DAV:}read',
                'protected' => true,
            ],
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private static function ownerAcl(): array {
        return [
            [
                'principal' => '{DAV:}owner',
                'privilege' => '{DAV:}all',
                'protected' => true,
            ],
        ];
    }
}
