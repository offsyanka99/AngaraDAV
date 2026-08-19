<?php

namespace Baikal\Portal\Http;

use Baikal\Portal\ApiException;
use Baikal\Portal\CalendarItemService;

/**
 * Portal JSON routes for tasks (VTODO) and notes (VJOURNAL).
 */
class ItemRoutes {
    public function __construct(
        private CalendarItemService $items,
        private HttpIO $http,
    ) {
    }

    /**
     * @return array<string, mixed>|list<mixed>|null
     */
    public function dispatch(string $method, string $path, string $username) {
        foreach (['tasks' => CalendarItemService::KIND_TASK, 'notes' => CalendarItemService::KIND_NOTE] as $seg => $kind) {
            if ($method === 'GET' && $path === '/' . $seg) {
                $q = isset($_GET['q']) ? (string) $_GET['q'] : '';
                $sort = isset($_GET['sort']) ? (string) $_GET['sort'] : '';
                $order = isset($_GET['order']) ? (string) $_GET['order'] : 'asc';

                return [
                    $seg        => $this->items->listItems($username, $kind, $q, $sort, $order),
                    'calendars' => $this->items->writableCalendars($username, $kind),
                ];
            }
            if ($method === 'POST' && $path === '/' . $seg) {
                $body = $this->http->jsonBody();
                $item = $this->items->createItem($username, $kind, $body);

                return [rtrim($seg, 's') => $item];
            }
            if ($method === 'POST' && $path === '/' . $seg . '/bulk') {
                $body = $this->http->jsonBody();
                $op = (string) ($body['op'] ?? '');
                $items = $body['items'] ?? [];
                if (!is_array($items)) {
                    throw new ApiException('items must be an array', 400);
                }
                $fields = $body['fields'] ?? [];
                if (!is_array($fields)) {
                    $fields = [];
                }

                return $this->items->bulkItems($username, $kind, $op, $items, $fields);
            }
            if (preg_match('#^/' . $seg . '/(\d+)/([^/]+)$#', $path, $m)) {
                $instanceId = (int) $m[1];
                $uri = rawurldecode($m[2]);
                $key = rtrim($seg, 's');
                if ($method === 'GET') {
                    return [$key => $this->items->getItem($username, $kind, $instanceId, $uri)];
                }
                if ($method === 'PATCH' || $method === 'PUT') {
                    $body = $this->http->jsonBody();
                    $item = $this->items->updateItem($username, $kind, $instanceId, $uri, $body);

                    return [$key => $item];
                }
                if ($method === 'DELETE') {
                    $this->items->deleteItem($username, $kind, $instanceId, $uri);

                    return ['ok' => true];
                }
            }
        }

        return null;
    }
}
