<?php

namespace Baikal\Core\Files;

use Sabre\DAV\Exception\BadRequest;
use Sabre\DAV\Exception\NotFound;
use Sabre\DAV\Exception\PreconditionFailed;
use Sabre\DAV\IFile;
use Sabre\DAV\Server;
use Sabre\DAV\ServerPlugin;
use Sabre\HTTP\RequestInterface;

/**
 * Enforces RFC 4918 state-list semantics for generic file requests.
 *
 * SabreDAV 4.7 combines a negated state token and a following ETag into one
 * negated expression. RFC 4918 requires factors in a list to be evaluated
 * separately and AND-ed, with parenthesized lists OR-ed.
 */
class IfHeaderPreconditionPlugin extends ServerPlugin {
    /** @var Server */
    private $server;

    public function initialize(Server $server) {
        $this->server = $server;
        $server->on('validateTokens', [$this, 'validateTokens'], 200);
    }

    public function getPluginName() {
        return 'files-if-preconditions';
    }

    public function validateTokens(RequestInterface $request, array &$sabreConditions): void {
        $path = trim($request->getPath(), '/');
        $header = $request->getHeader('If');
        if ($header === null || !str_starts_with($path, 'files/')) {
            return;
        }

        $conditions = $this->parseConditions($header, $path);
        if ($conditions === []) {
            throw new BadRequest('Invalid WebDAV If header');
        }

        foreach ($conditions as $condition) {
            $conditionValid = false;
            foreach ($condition['lists'] as $stateList) {
                $listValid = $stateList !== [];
                foreach ($stateList as $factor) {
                    $factorValid = $factor['token'] !== ''
                        ? $this->validateStateToken($condition['uri'], $factor['token'])
                        : $this->validateEtag($condition['uri'], $factor['etag']);
                    if ($factor['negate']) {
                        $factorValid = !$factorValid;
                    }
                    if (!$factorValid) {
                        $listValid = false;
                        break;
                    }
                }
                if ($listValid) {
                    $conditionValid = true;
                    break;
                }
            }
            if (!$conditionValid) {
                throw new PreconditionFailed('Failed to find a valid token/etag state list for ' . $condition['uri'], 'If');
            }
        }
    }

    /**
     * @return array<int, array{uri: string, lists: array<int, array<int, array{negate: bool, token: string, etag: string}>>}>
     */
    private function parseConditions(string $header, string $requestPath): array {
        $matches = [];
        preg_match_all(
            '/(?:\<(?P<uri>[^\>]*)\>\s*)?(?P<list>\([^\)]*\))/im',
            $header,
            $matches,
            PREG_SET_ORDER
        );

        $conditions = [];
        $conditionIndex = -1;
        foreach ($matches as $match) {
            if (!empty($match['uri']) || $conditionIndex < 0) {
                $uri = empty($match['uri'])
                    ? $requestPath
                    : trim($this->server->calculateUri($match['uri']), '/');
                $conditions[] = ['uri' => $uri, 'lists' => []];
                $conditionIndex = count($conditions) - 1;
            }

            $factorMatches = [];
            preg_match_all(
                '/(?:(?P<not>Not)\s+)?(?:\<(?P<token>[^\>]*)\>|\[(?P<etag>[^\]]*)\])/im',
                $match['list'],
                $factorMatches,
                PREG_SET_ORDER
            );
            $stateList = [];
            foreach ($factorMatches as $factor) {
                $stateList[] = [
                    'negate' => !empty($factor['not']),
                    'token' => $factor['token'] ?? '',
                    'etag' => $factor['etag'] ?? '',
                ];
            }
            $conditions[$conditionIndex]['lists'][] = $stateList;
        }

        return $conditions;
    }

    private function validateStateToken(string $uri, string $token): bool {
        $lockPlugin = $this->server->getPlugin('locks');
        if ($lockPlugin instanceof \Sabre\DAV\Locks\Plugin) {
            foreach ($lockPlugin->getLocks($uri) as $lock) {
                if ($token === 'opaquelocktoken:' . $lock->token) {
                    return true;
                }
            }
        }

        if (str_starts_with($token, \Sabre\DAV\Sync\Plugin::SYNCTOKEN_PREFIX)) {
            try {
                $node = $this->server->tree->getNodeForPath($uri);

                return $node instanceof \Sabre\DAV\Sync\ISyncCollection
                    && $node->getSyncToken() === substr($token, strlen(\Sabre\DAV\Sync\Plugin::SYNCTOKEN_PREFIX));
            } catch (NotFound $e) {
                return false;
            }
        }

        return false;
    }

    private function validateEtag(string $uri, string $etag): bool {
        try {
            $node = $this->server->tree->getNodeForPath($uri);

            return $node instanceof IFile && $node->getETag() === $etag;
        } catch (NotFound $e) {
            return false;
        }
    }
}
