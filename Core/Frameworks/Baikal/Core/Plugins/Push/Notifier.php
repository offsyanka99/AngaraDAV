<?php

namespace Baikal\Core\Plugins\Push;

use Psr\Http\Client\ClientInterface;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpClient\Psr18Client;

/**
 * Delivers WebDAV-Push notifications over the Web Push transport (RFC 8030),
 * with VAPID (RFC 8292) authentication and aes128gcm payload encryption
 * (RFC 8291), using the optional minishlink/web-push library.
 *
 * The library is treated as OPTIONAL: if it (or the required PHP extensions) is
 * not present, delivery is skipped and logged, and the DAV server keeps working
 * normally. This is why every entry point is guarded with class_exists().
 */
class Notifier {
    /** @var array{publicKey: string, privateKey: string} */
    private $vapidKeys;

    /** @var string VAPID subject (mailto: or https: contact URI) */
    private $subject;

    /** @var PushLogger */
    private $logger;

    /** @var SubscriptionValidator */
    private $validator;

    /**
     * @param array{publicKey: string, privateKey: string} $vapidKeys
     */
    public function __construct(
        array $vapidKeys,
        string $subject,
        PushLogger $logger,
        ?SubscriptionValidator $validator = null
    ) {
        $this->vapidKeys = $vapidKeys;
        $this->subject = $subject;
        $this->logger = $logger;
        $this->validator = $validator ?? new SubscriptionValidator();
    }

    public static function isAvailable(): bool {
        return class_exists(\Minishlink\WebPush\WebPush::class)
            && class_exists(\Minishlink\WebPush\Subscription::class);
    }

    /**
     * Deliver a single payload to a set of subscriptions.
     *
     * @param array<int, array<string, mixed>> $subscriptions rows from push_subscriptions
     * @param string                           $payload       XML push-message body
     * @param string                           $topicHeader   Web Push Topic header (dedupe)
     * @param string                           $urgency       normal|low|high|very-low
     *
     * @return array{invalid: array<int, int>, retry: bool} invalid row ids and
     *                                                      whether the job should retry
     */
    public function send(array $subscriptions, string $payload, string $topicHeader, string $urgency = 'normal'): array {
        $invalid = [];
        if ($subscriptions === []) {
            return ['invalid' => [], 'retry' => false];
        }
        if (!self::isAvailable()) {
            $this->logger->error('web push skipped: minishlink/web-push not installed', [
                'subscriptions' => count($subscriptions),
            ]);

            return ['invalid' => [], 'retry' => true];
        }

        $validated = [];
        $curlResolve = [];
        foreach ($subscriptions as $sub) {
            $endpoint = (string) $sub['push_resource'];
            $pin = $this->validator->connectionPin($endpoint);
            if ($pin === null) {
                $invalid[] = (int) $sub['id'];
                $this->logger->warn('push endpoint failed delivery-time validation', [
                    'id' => $sub['id'] ?? null,
                ]);
                continue;
            }
            $address = str_contains($pin['address'], ':') ? '[' . $pin['address'] . ']' : $pin['address'];
            $curlResolve[$pin['host']] = $pin['host'] . ':443:' . $address;
            $validated[] = $sub;
        }
        if ($validated === []) {
            return ['invalid' => array_values(array_unique($invalid)), 'retry' => false];
        }

        try {
            $webPush = new \Minishlink\WebPush\WebPush(
                [
                    'VAPID' => [
                        'subject'    => $this->subject,
                        'publicKey'  => $this->vapidKeys['publicKey'],
                        'privateKey' => $this->vapidKeys['privateKey'],
                    ],
                ],
                ['TTL' => 3600, 'urgency' => $urgency, 'topic' => $topicHeader],
                $this->psr18Client(array_values($curlResolve))
            );
        } catch (\Throwable $e) {
            $this->logger->error('web push init failed', ['error' => $e->getMessage()]);

            return ['invalid' => [], 'retry' => true];
        }

        $queued = 0;
        $retry = false;
        foreach ($validated as $sub) {
            $endpoint = (string) $sub['push_resource'];
            try {
                $subscription = \Minishlink\WebPush\Subscription::create([
                    'endpoint'        => $endpoint,
                    'publicKey'       => (string) $sub['pubkey'],
                    'authToken'       => (string) $sub['auth_secret'],
                    'contentEncoding' => (string) ($sub['content_encoding'] ?: 'aes128gcm'),
                ]);
                $webPush->queueNotification($subscription, $payload);
                ++$queued;
            } catch (\Throwable $e) {
                $retry = true;
                $this->logger->warn('failed to queue push notification', [
                    'id'    => $sub['id'] ?? null,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->logger->debug('flushing push notifications', ['queued' => $queued, 'topic' => $topicHeader]);

        try {
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getEndpoint();
                if ($report->isSuccess()) {
                    $this->logger->debug('push delivered', ['endpoint' => $this->redactEndpoint($endpoint)]);
                    continue;
                }
                if ($report->isSubscriptionExpired()) {
                    foreach ($validated as $sub) {
                        if ((string) $sub['push_resource'] === $endpoint) {
                            $invalid[] = (int) $sub['id'];
                        }
                    }
                    $this->logger->info('push subscription gone; will remove', [
                        'endpoint' => $this->redactEndpoint($endpoint),
                    ]);
                } else {
                    $retry = true;
                    $this->logger->warn('push delivery failed', [
                        'endpoint' => $this->redactEndpoint($endpoint),
                        'status'   => $report->getResponse()?->getStatusCode(),
                        'reason'   => $report->getReason(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            $retry = true;
            $this->logger->error('web push flush failed', ['error' => $e->getMessage()]);
        }

        return ['invalid' => array_values(array_unique($invalid)), 'retry' => $retry];
    }

    /**
     * PSR-18 client with DNS pin (CURLOPT_RESOLVE) so delivery cannot follow a
     * re-resolved host after SubscriptionValidator has locked the IP.
     *
     * @param list<string> $curlResolve host:port:address entries
     */
    private function psr18Client(array $curlResolve): ClientInterface {
        $http = HttpClient::create([
            'timeout'       => 10,
            'max_duration'  => 10,
            'max_redirects' => 0,
            'extra'         => [
                'curl' => [
                    CURLOPT_CONNECTTIMEOUT => 5,
                    CURLOPT_PROXY          => '',
                    CURLOPT_RESOLVE        => $curlResolve,
                ],
            ],
        ]);

        return new Psr18Client($http);
    }

    /**
     * Keep only the endpoint origin in logs (push URLs identify a subscriber).
     */
    private function redactEndpoint(string $endpoint): string {
        $parts = parse_url($endpoint);
        if (!is_array($parts) || !isset($parts['host'])) {
            return '[endpoint]';
        }

        return ($parts['scheme'] ?? 'https') . '://' . $parts['host'] . '/…';
    }
}
