<?php

namespace Baikal\Portal;

use Sabre\VObject\Recur\RRuleIterator;

/**
 * CalDAV RRULE read/write shared by VEVENT and VTODO.
 *
 * Frequencies are DAILY, WEEKLY, MONTHLY, and YEARLY. WEEKLY may set BYDAY.
 * End is never, UNTIL (a date), or COUNT. INTERVAL is 1–99.
 */
class RecurrenceRule {
    /**
     * @param mixed $rruleProperty Sabre property, raw rule string, or null
     *
     * @return array{freq: string, interval: int, until: string|null, count: int|null, byDay: list<string>}
     */
    public static function parse($rruleProperty): array {
        $empty = self::empty();
        if ($rruleProperty === null) {
            return $empty;
        }
        try {
            $parts = is_object($rruleProperty) && method_exists($rruleProperty, 'getParts')
                ? $rruleProperty->getParts()
                : [];
            if (!is_array($parts) || $parts === []) {
                $raw = trim((string) $rruleProperty);
                if ($raw === '') {
                    return $empty;
                }
                $parts = [];
                foreach (explode(';', $raw) as $seg) {
                    if (str_contains($seg, '=')) {
                        [$k, $v] = explode('=', $seg, 2);
                        $parts[strtoupper(trim($k))] = trim($v);
                    }
                }
            }
        } catch (\Throwable $e) {
            return $empty;
        }
        $freq = strtoupper((string) ($parts['FREQ'] ?? ''));
        $allowed = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!in_array($freq, $allowed, true)) {
            return $empty;
        }
        $interval = max(1, min(99, (int) ($parts['INTERVAL'] ?? 1)));
        $until = null;
        if (!empty($parts['UNTIL'])) {
            $u = (string) $parts['UNTIL'];
            if (preg_match('/^(\d{4})(\d{2})(\d{2})/', $u, $m)) {
                $until = $m[1] . '-' . $m[2] . '-' . $m[3];
            }
        }
        $count = null;
        if (isset($parts['COUNT']) && (int) $parts['COUNT'] > 0) {
            $count = min(999, (int) $parts['COUNT']);
        }
        $byDay = [];
        if (!empty($parts['BYDAY'])) {
            $rawDays = is_array($parts['BYDAY']) ? $parts['BYDAY'] : explode(',', (string) $parts['BYDAY']);
            $ok = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            foreach ($rawDays as $d) {
                $d = strtoupper(preg_replace('/[^A-Z]/', '', (string) $d) ?? '');
                if (in_array($d, $ok, true)) {
                    $byDay[] = $d;
                }
            }
        }

        return [
            'freq'     => $freq,
            'interval' => $interval,
            'until'    => $until,
            'count'    => $count,
            'byDay'    => array_values(array_unique($byDay)),
        ];
    }

    /**
     * @param array<string, mixed> $repeat
     */
    public static function build(array $repeat): ?string {
        $freq = strtoupper(trim((string) ($repeat['freq'] ?? '')));
        if ($freq === '' || $freq === 'NONE') {
            return null;
        }
        $allowed = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!in_array($freq, $allowed, true)) {
            throw new ApiException('Invalid repeat frequency', 400);
        }
        $interval = max(1, min(99, (int) ($repeat['interval'] ?? 1)));
        $parts = ['FREQ=' . $freq];
        if ($interval !== 1) {
            $parts[] = 'INTERVAL=' . $interval;
        }
        $byDay = $repeat['byDay'] ?? $repeat['byday'] ?? [];
        if (is_array($byDay) && $byDay !== [] && $freq === 'WEEKLY') {
            $ok = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            $days = [];
            foreach ($byDay as $d) {
                $d = strtoupper(trim((string) $d));
                if (in_array($d, $ok, true)) {
                    $days[] = $d;
                }
            }
            if ($days !== []) {
                $parts[] = 'BYDAY=' . implode(',', array_unique($days));
            }
        }
        $until = isset($repeat['until']) ? trim((string) $repeat['until']) : '';
        $count = isset($repeat['count']) ? (int) $repeat['count'] : 0;
        if ($until !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $until)) {
            $parts[] = 'UNTIL=' . str_replace('-', '', $until);
        } elseif ($count > 0) {
            $parts[] = 'COUNT=' . min(999, $count);
        }

        return implode(';', $parts);
    }

    /**
     * First recurrence strictly after $anchor. Null when the rule has no further instance.
     */
    public static function nextAfter(string $rrule, \DateTimeInterface $anchor): ?\DateTimeImmutable {
        $rrule = trim($rrule);
        if ($rrule === '') {
            return null;
        }
        try {
            $start = \DateTimeImmutable::createFromInterface($anchor);
            $it = new RRuleIterator($rrule, $start);
            $it->fastForward($start->modify('+1 second'));
        } catch (\Throwable $e) {
            throw new ApiException('Invalid repeat rule', 400);
        }
        if (!$it->valid()) {
            return null;
        }
        $cur = $it->current();
        if (!$cur instanceof \DateTimeInterface) {
            return null;
        }
        if ($cur->getTimestamp() <= $anchor->getTimestamp()) {
            return null;
        }

        return \DateTimeImmutable::createFromInterface($cur);
    }

    /**
     * @return array{freq: string, interval: int, until: string|null, count: int|null, byDay: list<string>}
     */
    public static function empty(): array {
        return [
            'freq'     => '',
            'interval' => 1,
            'until'    => null,
            'count'    => null,
            'byDay'    => [],
        ];
    }
}
