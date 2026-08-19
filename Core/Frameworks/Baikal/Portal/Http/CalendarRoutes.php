<?php

namespace Baikal\Portal\Http;

use Baikal\Portal\CalendarImportService;
use Baikal\Portal\CalendarService;
use Baikal\Portal\EventService;
use Baikal\Portal\Holidays;
use Baikal\Portal\ShareService;

/**
 * Portal JSON routes for calendars, events, shares, directory, and ICS import.
 */
class CalendarRoutes {
    public function __construct(
        private CalendarService $calendars,
        private EventService $events,
        private ShareService $shares,
        private CalendarImportService $import,
        private HttpIO $http,
    ) {
    }

    /**
     * @return array<string, mixed>|list<mixed>|null
     */
    public function dispatch(string $method, string $path, string $username) {
        if ($method === 'GET' && $path === '/directory') {
            return ['users' => $this->shares->directory($username)];
        }

        if ($method === 'GET' && $path === '/holidays/countries') {
            return ['countries' => Holidays::countries()];
        }

        if ($method === 'GET' && $path === '/calendars') {
            return ['calendars' => $this->calendars->listCalendars($username)];
        }

        if ($method === 'POST' && $path === '/calendars') {
            $body = $this->http->jsonBody();
            $cal = $this->calendars->createCalendar($username, $body);

            return [
                'calendar'      => $cal,
                'holidayImport' => $cal['holidayImport'] ?? null,
            ];
        }

        if (preg_match('#^/calendars/(\d+)$#', $path, $m) && ($method === 'PATCH' || $method === 'PUT')) {
            $instanceId = (int) $m[1];
            $body = $this->http->jsonBody();
            $cal = $this->calendars->updateCalendar($username, $instanceId, $body);

            return ['calendar' => $cal];
        }

        if (preg_match('#^/calendars/(\d+)$#', $path, $m) && $method === 'DELETE') {
            $instanceId = (int) $m[1];
            $this->calendars->deleteCalendar($username, $instanceId);

            return ['ok' => true];
        }

        if (preg_match('#^/calendars/(\d+)/events$#', $path, $m)) {
            $instanceId = (int) $m[1];
            if ($method === 'GET') {
                $from = isset($_GET['from']) ? (string) $_GET['from'] : '';
                $to = isset($_GET['to']) ? (string) $_GET['to'] : '';

                return [
                    'events' => $this->events->listEvents($username, $instanceId, $from, $to),
                ];
            }
            if ($method === 'POST') {
                $body = $this->http->jsonBody();
                $event = $this->events->createEvent($username, $instanceId, $body);

                return ['event' => $event];
            }
        }

        if (preg_match('#^/calendars/(\d+)/events/([^/]+)$#', $path, $m)) {
            $instanceId = (int) $m[1];
            $uri = rawurldecode($m[2]);
            if ($method === 'GET') {
                return ['event' => $this->events->getEvent($username, $instanceId, $uri)];
            }
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->http->jsonBody();
                $event = $this->events->updateEvent($username, $instanceId, $uri, $body);

                return ['event' => $event];
            }
            if ($method === 'DELETE') {
                $this->events->deleteEvent($username, $instanceId, $uri);

                return ['ok' => true];
            }
        }

        if ($method === 'POST' && preg_match('#^/calendars/(\d+)/import$#', $path, $m)) {
            $instanceId = (int) $m[1];
            if (function_exists('set_time_limit')) {
                @set_time_limit(600);
            }
            @ini_set('memory_limit', '512M');
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }
            $ics = $this->http->readIcsPayload();
            if ($this->http->wantsImportProgressStream()) {
                $this->http->streamImportProgress(function (?callable $onProgress) use ($username, $instanceId, $ics) {
                    return $this->import->importCalendar($username, $instanceId, $ics, false, $onProgress);
                });

                return null;
            }

            return $this->import->importCalendar($username, $instanceId, $ics);
        }

        if (preg_match('#^/calendars/(\d+)/shares$#', $path, $m)) {
            $instanceId = (int) $m[1];
            if ($method === 'GET') {
                return ['shares' => $this->shares->listShares($username, $instanceId)];
            }
            if ($method === 'POST') {
                $body = $this->http->jsonBody();
                $share = $this->shares->addOrUpdateShare(
                    $username,
                    $instanceId,
                    (string) ($body['username'] ?? ''),
                    (string) ($body['access'] ?? 'read')
                );

                return ['share' => $share];
            }
            if ($method === 'DELETE') {
                $body = $this->http->jsonBody();
                $href = (string) ($body['href'] ?? ($_GET['href'] ?? ''));
                $this->shares->revokeShare($username, $instanceId, $href);

                return ['ok' => true];
            }
        }

        return null;
    }
}
