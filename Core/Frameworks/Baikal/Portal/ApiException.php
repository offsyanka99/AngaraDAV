<?php

namespace Baikal\Portal;

class ApiException extends \RuntimeException {
    /** @var int */
    private $status;

    /** @var array<string, mixed> */
    private $payload;

    /**
     * @param array<string, mixed> $payload extra JSON fields merged into the error response body
     */
    public function __construct(string $message, int $status = 400, array $payload = []) {
        parent::__construct($message);
        $this->status = $status;
        $this->payload = $payload;
    }

    public function getStatus(): int {
        return $this->status;
    }

    /**
     * @return array<string, mixed>
     */
    public function getPayload(): array {
        return $this->payload;
    }
}
