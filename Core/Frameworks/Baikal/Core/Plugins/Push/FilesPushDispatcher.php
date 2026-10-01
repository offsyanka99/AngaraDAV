<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Turns file-home changes into debounced push queue jobs, only for paths that
 * have active subscriptions (plan D5). File paths are logged as topics below
 * debug level, because folder names are personal data (plan D9).
 */
class FilesPushDispatcher {
    public const DEBOUNCE_SECONDS = 5;
    public const MAX_HOLD_SECONDS = 30;

    /** @var QueueStorage */
    private $queue;

    /** @var SubscriptionStorage */
    private $subscriptions;

    /** @var TopicResolver */
    private $topics;

    /** @var PushLogger */
    private $logger;

    public function __construct(
        QueueStorage $queue,
        SubscriptionStorage $subscriptions,
        TopicResolver $topics,
        PushLogger $logger
    ) {
        $this->queue = $queue;
        $this->subscriptions = $subscriptions;
        $this->topics = $topics;
        $this->logger = $logger;
    }

    /**
     * @param callable(string): array<int, int> $suppressedIdsFor subscription ids to skip per path
     *
     * @return int number of jobs enqueued
     */
    public function dispatch(FilesChangeSet $changes, callable $suppressedIdsFor, string $source): int {
        if ($changes->isEmpty()) {
            return 0;
        }
        $levels = FilesPushFanout::levels($changes);
        foreach ($changes->removedPaths() as $removed) {
            foreach ($this->subscriptions->findActiveResourceUrisUnder($removed) as $descendant) {
                FilesPushFanout::lower($levels, $descendant, FilesPushFanout::LEVEL_SELF);
            }
        }

        $enqueued = 0;
        foreach ($this->subscriptions->findActiveResourceUris(array_map('strval', array_keys($levels))) as $path) {
            $level = $levels[$path];
            $this->queue->enqueue(
                $path,
                $this->topics->forPath($path),
                true,
                false,
                null,
                $suppressedIdsFor($path),
                $level,
                self::DEBOUNCE_SECONDS,
                self::MAX_HOLD_SECONDS
            );
            $this->logger->info('files content notification enqueued', [
                'resource' => $this->resourceForLog($path),
                'level'    => $level,
                'source'   => $source,
            ]);
            ++$enqueued;
        }

        return $enqueued;
    }

    /**
     * @param callable(string): array<int, int> $suppressedIdsFor
     *
     * @return int number of jobs enqueued (0 or 1)
     */
    public function dispatchProperty(string $path, callable $suppressedIdsFor, string $source): int {
        $path = trim($path, '/');
        if ($this->subscriptions->findActiveResourceUris([$path]) === []) {
            return 0;
        }
        $this->queue->enqueue(
            $path,
            $this->topics->forPath($path),
            false,
            true,
            null,
            $suppressedIdsFor($path),
            FilesPushFanout::LEVEL_MEMBER,
            self::DEBOUNCE_SECONDS,
            self::MAX_HOLD_SECONDS
        );
        $this->logger->info('files property notification enqueued', [
            'resource' => $this->resourceForLog($path),
            'source'   => $source,
        ]);

        return 1;
    }

    /**
     * Log-safe form of a DAV path: file paths become their topic unless debug logging is on.
     */
    public function resourceForLog(string $path): string {
        if (!FilesPushPaths::isFilesPath($path) || $this->logger->isEnabled('debug')) {
            return $path;
        }

        return 'files-topic:' . $this->topics->forPath($path);
    }
}
