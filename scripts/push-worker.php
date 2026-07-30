<?php

declare(strict_types=1);

use Baikal\Core\Plugins\Push\Notifier;
use Baikal\Core\Plugins\Push\PushLogger;
use Baikal\Core\Plugins\Push\PushWorker;
use Baikal\Core\Plugins\Push\QueueStorage;
use Baikal\Core\Plugins\Push\SchemaManager;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Core\Plugins\Push\SubscriptionValidator;
use Baikal\Core\Plugins\Push\VapidKeyStore;
use Symfony\Component\Yaml\Yaml;

$root = dirname(__DIR__) . '/';
define('BAIKAL_CONTEXT', true);
define('PROJECT_CONTEXT_BASEURI', '/');
define('PROJECT_PATH_ROOT', $root);

require $root . 'vendor/autoload.php';

\Flake\Framework::bootstrap();
\Baikal\Framework::bootstrap();

$config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'baikal.yaml');
$sys = is_array($config['system'] ?? null) ? $config['system'] : [];
if (empty($sys['push_enabled'])) {
    exit(0);
}

$logger = new PushLogger(isset($sys['push_log_level']) ? (string) $sys['push_log_level'] : 'off');
$lockPath = rtrim(PROJECT_PATH_SPECIFIC, '/') . '/push_worker.lock';
$lockHandle = @fopen($lockPath, 'c');
if ($lockHandle === false || !@chmod($lockPath, 0600) || !@flock($lockHandle, LOCK_EX | LOCK_NB)) {
    $logger->warn('push worker not started: another worker holds the lock or lock creation failed');
    exit(0);
}
$pdo = $GLOBALS['DB']->getPDO();
try {
    SchemaManager::ensure($pdo);
} catch (Throwable $e) {
    $logger->error('push worker cannot start: queue schema unavailable');
    exit(2);
}

$allowedHosts = isset($sys['push_allowed_hosts']) && is_array($sys['push_allowed_hosts'])
    ? $sys['push_allowed_hosts']
    : [];
$validator = new SubscriptionValidator($allowedHosts);
$keyStore = new VapidKeyStore(null, $logger);
$keys = $keyStore->getKeys();
if ($keys === null) {
    $logger->error('push worker cannot start: VAPID keys unavailable');
    exit(1);
}

$from = isset($sys['invite_from']) ? trim((string) $sys['invite_from']) : '';
$subject = $from !== '' && filter_var($from, FILTER_VALIDATE_EMAIL)
    ? 'mailto:' . $from
    : 'mailto:webmaster@localhost';
$notifier = new Notifier($keys, $subject, $logger, $validator);
try {
    $subscriptions = new SubscriptionStorage(
        $pdo,
        new SecretCipher((string) ($config['database']['encryption_key'] ?? ''))
    );
} catch (Throwable $e) {
    $logger->error('push worker cannot start: invalid database encryption key');
    exit(2);
}
$worker = new PushWorker(
    $pdo,
    new QueueStorage($pdo),
    $subscriptions,
    $notifier,
    $logger,
    max(1, min(10, (int) ($sys['push_max_delivery_attempts'] ?? 5)))
);

$once = in_array('--once', $argv, true);
$batchSize = max(1, min(100, (int) ($sys['push_worker_batch_size'] ?? 20)));
$sleepMicros = max(250000, min(10000000, (int) ($sys['push_worker_poll_ms'] ?? 2000) * 1000));
$lastPurge = 0;

do {
    try {
        $processed = $worker->runOnce($batchSize);
        if (time() - $lastPurge >= 3600) {
            $subscriptions->purgeExpired();
            $lastPurge = time();
        }
    } catch (Throwable $e) {
        $logger->error('push worker loop failed', ['error' => $e->getMessage()]);
        $processed = 0;
    }

    if (!$once && $processed === 0) {
        usleep($sleepMicros);
    }
} while (!$once);
