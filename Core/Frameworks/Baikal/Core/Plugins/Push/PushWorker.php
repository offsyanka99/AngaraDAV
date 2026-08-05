<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Bounded worker for persistent WebDAV-Push jobs.
 */
class PushWorker {
    const NS = 'https://bitfire.at/webdav-push';

    /** @var \PDO */
    private $pdo;

    /** @var QueueStorage */
    private $queue;

    /** @var SubscriptionStorage */
    private $subscriptions;

    /** @var Notifier */
    private $notifier;

    /** @var PushLogger */
    private $logger;

    /** @var int */
    private $maxAttempts;

    public function __construct(
        \PDO $pdo,
        QueueStorage $queue,
        SubscriptionStorage $subscriptions,
        Notifier $notifier,
        PushLogger $logger,
        int $maxAttempts = 5
    ) {
        $this->pdo = $pdo;
        $this->queue = $queue;
        $this->subscriptions = $subscriptions;
        $this->notifier = $notifier;
        $this->logger = $logger;
        $this->maxAttempts = max(1, min($maxAttempts, 10));
    }

    /**
     * Process at most $batchSize jobs and return the number examined.
     */
    public function runOnce(int $batchSize = 20): int {
        $jobs = $this->queue->nextBatch($batchSize);
        foreach ($jobs as $job) {
            $this->process($job);
        }

        return count($jobs);
    }

    /**
     * @param array<string, mixed> $job
     */
    private function process(array $job): void {
        $jobId = (int) $job['id'];
        try {
            $suppressed = json_decode((string) $job['suppressed_ids'], true);
            $suppressed = is_array($suppressed) ? array_map('intval', $suppressed) : [];
            $targets = [];

            foreach ($this->subscriptions->findActiveByResource((string) $job['resource_uri']) as $sub) {
                $id = (int) $sub['id'];
                if (in_array($id, $suppressed, true)) {
                    continue;
                }
                if (!$this->isStillAuthorized((string) $sub['principaluri'], (string) $job['resource_uri'])) {
                    $this->subscriptions->deleteById($id);
                    $this->logger->info('removed subscription after access revocation', ['id' => $id]);
                    continue;
                }

                $triggers = json_decode((string) $sub['triggers'], true);
                $wantsContent = !empty($job['content_update'])
                    && is_array($triggers)
                    && in_array($triggers['content'] ?? null, ['1', 'infinity'], true);
                $wantsProperty = !empty($job['property_update'])
                    && is_array($triggers)
                    && ($triggers['property'] ?? null) !== null;
                if ($wantsContent || $wantsProperty) {
                    $targets[] = $sub;
                }
            }

            if ($targets === []) {
                $this->queue->complete($jobId);

                return;
            }

            $payload = $this->buildMessage(
                (string) $job['topic'],
                !empty($job['content_update']),
                !empty($job['property_update']),
                isset($job['sync_token']) ? (string) $job['sync_token'] : null
            );
            $result = $this->notifier->send($targets, $payload, (string) $job['topic']);
            foreach ($result['invalid'] as $invalidId) {
                $this->subscriptions->deleteById($invalidId);
            }

            $attempts = (int) $job['attempts'] + 1;
            if ($result['retry'] && $attempts < $this->maxAttempts) {
                $this->queue->retry($jobId, $attempts);
                $this->logger->warn('push job scheduled for retry', [
                    'job'      => $jobId,
                    'attempts' => $attempts,
                ]);
            } else {
                $this->queue->complete($jobId);
                if ($result['retry']) {
                    $this->logger->error('push job exhausted retries', ['job' => $jobId]);
                }
            }
        } catch (\Throwable $e) {
            $attempts = (int) $job['attempts'] + 1;
            if ($attempts < $this->maxAttempts) {
                $this->queue->retry($jobId, $attempts);
            } else {
                $this->queue->complete($jobId);
            }
            $this->logger->error('push worker job failed', [
                'job'   => $jobId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function isStillAuthorized(string $principal, string $resourceUri): bool {
        $parts = explode('/', trim($resourceUri, '/'));
        if (count($parts) < 2) {
            return false;
        }
        $ownerPrincipal = 'principals/' . rawurldecode($parts[1]);
        if ($parts[0] === 'principals') {
            return $principal === $resourceUri;
        }
        if (count($parts) === 2) {
            return $principal === $ownerPrincipal;
        }

        $uri = rawurldecode($parts[2]);
        if ($parts[0] === 'calendars') {
            // Prefer exact instance path (owner or sharee view of this collection).
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) FROM calendarinstances WHERE principaluri = ? AND uri = ?'
            );
            $stmt->execute([$principal, $uri]);
            if ((int) $stmt->fetchColumn() > 0) {
                return true;
            }
            // Fallback: principal still has any instance of the same underlying calendar
            // (covers edge cases if resource_uri and subscription uri tokens diverge).
            try {
                $stmt = $this->pdo->prepare(
                    'SELECT calendarid FROM calendarinstances WHERE principaluri = ? AND uri = ? LIMIT 1'
                );
                // Path owner segment may not match $principal; resolve calendar via path owner.
                $stmt->execute([$ownerPrincipal, $uri]);
                $calendarId = $stmt->fetchColumn();
                if ($calendarId === false || $calendarId === null) {
                    return false;
                }
                $stmt = $this->pdo->prepare(
                    'SELECT COUNT(*) FROM calendarinstances WHERE principaluri = ? AND calendarid = ?'
                );
                $stmt->execute([$principal, (int) $calendarId]);

                return (int) $stmt->fetchColumn() > 0;
            } catch (\Throwable $e) {
                return false;
            }
        }
        if ($parts[0] === 'addressbooks') {
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) FROM addressbooks WHERE principaluri = ? AND uri = ?'
            );
            $stmt->execute([$principal, $uri]);

            return (int) $stmt->fetchColumn() > 0;
        }

        return false;
    }

    private function buildMessage(
        string $topic,
        bool $contentUpdate,
        bool $propertyUpdate,
        ?string $syncToken
    ): string {
        $xml = '<?xml version="1.0" encoding="utf-8"?>' . "\n"
            . '<push-message xmlns="' . self::NS . '" xmlns:D="DAV:">'
            . '<topic>' . $this->xml($topic) . '</topic>';
        if ($contentUpdate) {
            $xml .= $syncToken !== null && $syncToken !== ''
                ? '<content-update><D:sync-token>' . $this->xml($syncToken) . '</D:sync-token></content-update>'
                : '<content-update/>';
        }
        if ($propertyUpdate) {
            $xml .= '<property-update/>';
        }

        return $xml . '</push-message>';
    }

    private function xml(string $value): string {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
