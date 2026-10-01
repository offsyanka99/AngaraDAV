<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Bounded worker for persistent WebDAV-Push jobs.
 */
class PushWorker {
    const NS = 'https://bitfire.at/webdav-push';

    /** Content-update depth rank, compared with a job's min_content_depth level. */
    private const DEPTH_RANK = ['0' => 0, '1' => 1, 'infinity' => 2];

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
        $this->queue->markPicked(array_map(static fn (array $job): int => (int) $job['id'], $jobs));
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
        $revision = (int) ($job['revision'] ?? 0);
        try {
            $suppressed = json_decode((string) $job['suppressed_ids'], true);
            $suppressed = is_array($suppressed) ? array_map('intval', $suppressed) : [];
            $level = (int) ($job['min_content_depth'] ?? 1);
            // Subscribers can qualify for different triggers, so each (content, property) pair gets its own message.
            $groups = [];

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
                $contentDepth = is_array($triggers) && isset($triggers['content'])
                    ? (self::DEPTH_RANK[(string) $triggers['content']] ?? null)
                    : null;
                $wantsContent = !empty($job['content_update']) && $contentDepth !== null && $contentDepth >= $level;
                $wantsProperty = !empty($job['property_update'])
                    && is_array($triggers)
                    && ($triggers['property'] ?? null) !== null;
                if ($wantsContent || $wantsProperty) {
                    $key = ($wantsContent ? 'c' : '') . ($wantsProperty ? 'p' : '');
                    $groups[$key]['content'] = $wantsContent;
                    $groups[$key]['property'] = $wantsProperty;
                    $groups[$key]['targets'][] = $sub;
                }
            }

            if ($groups === []) {
                $this->queue->complete($jobId, $revision);

                return;
            }

            $invalid = [];
            $retry = false;
            foreach ($groups as $group) {
                $payload = $this->buildMessage(
                    (string) $job['topic'],
                    $group['content'],
                    $group['property'],
                    isset($job['sync_token']) ? (string) $job['sync_token'] : null
                );
                $result = $this->notifier->send($group['targets'], $payload, (string) $job['topic']);
                $invalid = array_merge($invalid, $result['invalid']);
                $retry = $retry || $result['retry'];
            }
            foreach ($invalid as $invalidId) {
                $this->subscriptions->deleteById($invalidId);
            }
            if (FilesPushPaths::isFilesPath((string) $job['resource_uri'])) {
                $this->logger->debug('files push sent', [
                    'topic'   => (string) $job['topic'],
                    'level'   => $level,
                    'delay'   => time() - (int) $job['created'],
                    'merges'  => $revision,
                    'targets' => array_sum(array_map(static fn (array $group): int => count($group['targets']), $groups)),
                    'retry'   => $retry,
                ]);
            }

            $attempts = (int) $job['attempts'] + 1;
            if ($retry && $attempts < $this->maxAttempts) {
                $this->queue->retry($jobId, $attempts, $revision);
                $this->logger->warn('push job scheduled for retry', [
                    'job'      => $jobId,
                    'attempts' => $attempts,
                ]);
            } else {
                $this->queue->complete($jobId, $revision);
                if ($retry) {
                    $this->logger->error('push job exhausted retries', ['job' => $jobId]);
                }
            }
        } catch (\Throwable $e) {
            $attempts = (int) $job['attempts'] + 1;
            if ($attempts < $this->maxAttempts) {
                $this->queue->retry($jobId, $attempts, $revision);
            } else {
                $this->queue->complete($jobId, $revision);
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
        if ($parts[0] === FilesPushPaths::ROOT) {
            // Sabre stores file paths decoded; rawurldecode() would corrupt names containing '%'.
            return $principal === 'principals/' . $parts[1] && $this->hasActiveFileHome($principal);
        }
        $ownerPrincipal = 'principals/' . $parts[1];
        if ($parts[0] === 'principals') {
            return $principal === $resourceUri;
        }
        if (count($parts) === 2) {
            return $principal === $ownerPrincipal;
        }

        // Mirrors the Sabre ACLs that gated registration: the subscriber's own collection
        // name must never authorize access to another owner's path.
        $uri = $parts[2];
        if ($parts[0] === 'calendars') {
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) FROM calendarinstances WHERE principaluri = ? AND uri = ?'
            );
            $stmt->execute([$ownerPrincipal, $uri]);
            if ((int) $stmt->fetchColumn() === 0) {
                return false;
            }

            return $principal === $ownerPrincipal || $this->isCalendarProxy($principal, $ownerPrincipal);
        }
        if ($parts[0] === 'addressbooks') {
            if ($principal !== $ownerPrincipal) {
                return false;
            }
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) FROM addressbooks WHERE principaluri = ? AND uri = ?'
            );
            $stmt->execute([$ownerPrincipal, $uri]);

            return (int) $stmt->fetchColumn() > 0;
        }

        return false;
    }

    /**
     * Member of the owner's calendar-proxy-read or calendar-proxy-write group (Sabre calendar ACL).
     */
    private function isCalendarProxy(string $principal, string $ownerPrincipal): bool {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM groupmembers g
             JOIN principals grp ON grp.id = g.principal_id
             JOIN principals mem ON mem.id = g.member_id
             WHERE mem.uri = ? AND grp.uri IN (?, ?)'
        );
        $stmt->execute([$principal, $ownerPrincipal . '/calendar-proxy-read', $ownerPrincipal . '/calendar-proxy-write']);

        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * Query errors propagate (job retry) instead of returning false, which would delete the subscription.
     */
    private function hasActiveFileHome(string $principal): bool {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM file_homes WHERE principaluri = ? AND status = 'active'");
        $stmt->execute([$principal]);

        return (int) $stmt->fetchColumn() > 0;
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
