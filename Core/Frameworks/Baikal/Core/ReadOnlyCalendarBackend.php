<?php

namespace Baikal\Core;

use Baikal\Portal\PortalMeta;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;

/**
 * Adds portal read-only metadata to SabreDAV calendar discovery and ACLs.
 */
class ReadOnlyCalendarBackend extends \Sabre\CalDAV\Backend\PDO {
    /** @var PortalMeta */
    private $meta;

    public function __construct(\PDO $pdo, ?PortalMeta $meta = null) {
        parent::__construct($pdo);
        $this->meta = $meta ?? new PortalMeta();
    }

    public function getCalendarsForUser($principalUri) {
        $calendars = parent::getCalendarsForUser($principalUri);
        foreach ($calendars as &$calendar) {
            if (!$this->isPortalReadOnly($calendar)) {
                continue;
            }
            $calendar['{http://sabredav.org/ns}read-only'] = true;
            $calendar['read-only'] = true;
            $calendar['share-access'] = SharingPlugin::ACCESS_READ;
        }
        unset($calendar);

        return $calendars;
    }

    /** @param array<string, mixed> $calendar */
    private function isPortalReadOnly(array $calendar): bool {
        $ids = $calendar['id'] ?? null;
        if (!is_array($ids) || count($ids) < 2) {
            return false;
        }

        $calendarId = (int) $ids[0];
        $instanceId = (int) $ids[1];
        if ($this->meta->isReadOnly($instanceId)) {
            return true;
        }
        if ($calendarId <= 0) {
            return false;
        }

        $stmt = $this->pdo->prepare(
            'SELECT id FROM calendarinstances WHERE calendarid = ? AND access IN (?, ?)'
        );
        $stmt->execute([
            $calendarId,
            SharingPlugin::ACCESS_NOTSHARED,
            SharingPlugin::ACCESS_SHAREDOWNER,
        ]);
        while ($owner = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if ($this->meta->isReadOnly((int) $owner['id'])) {
                return true;
            }
        }

        return false;
    }
}
