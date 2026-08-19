<?php

namespace Baikal\Portal\Http;

use Baikal\Portal\ApiException;
use Baikal\Portal\SameOrigin;

/**
 * Request parsing and binary/JSON response helpers for the portal API.
 */
class HttpIO {
    /** @var array<string, mixed>|null */
    private ?array $jsonBodyCache = null;

    private ?string $rawBodyCache = null;

    /** True when a streaming / download response was already sent (skip json()). */
    public bool $responseSent = false;

    public function csrfFromRequest(): string {
        $h = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_SERVER['HTTP_X_BAIKAL_CSRF'] ?? '';
        if (is_string($h) && $h !== '') {
            return $h;
        }

        return '';
    }

    /**
     * Reject cross-site browser requests (defense in depth with SameSite=Lax + CSRF).
     * Fail closed when neither Origin nor Referer is present on state-changing calls.
     */
    public function assertSameOrigin(): void {
        SameOrigin::assert($_SERVER);
    }

    public function rawRequestBody(): string {
        if ($this->rawBodyCache !== null) {
            return $this->rawBodyCache;
        }
        $raw = file_get_contents('php://input');
        $this->rawBodyCache = $raw === false ? '' : $raw;

        return $this->rawBodyCache;
    }

    /**
     * @param list<string> $rawContentTypes
     */
    public function readPayloadField(string $jsonField, array $rawContentTypes): string {
        $ct = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''));
        $raw = $this->rawRequestBody();

        foreach ($rawContentTypes as $t) {
            if (str_contains($ct, $t)) {
                if (trim($raw) === '') {
                    throw new ApiException('Request body is empty', 400);
                }

                return $raw;
            }
        }

        $isJson = str_contains($ct, 'application/json')
            || (isset($raw[0]) && ($raw[0] === '{' || $raw[0] === '['));
        if ($isJson) {
            $data = json_decode($raw, true);
            if (!is_array($data)) {
                throw new ApiException('Invalid JSON body (import prefers raw text/calendar or text/vcard)', 400);
            }
            if (isset($data[$jsonField]) && is_string($data[$jsonField]) && $data[$jsonField] !== '') {
                return $data[$jsonField];
            }
            throw new ApiException('JSON body must include string field "' . $jsonField . '"', 400);
        }

        if (trim($raw) === '') {
            throw new ApiException('Request body is empty', 400);
        }

        return $raw;
    }

    public function readIcsPayload(): string {
        return $this->readPayloadField('ics', ['text/calendar']);
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonBody(): array {
        if ($this->jsonBodyCache !== null) {
            return $this->jsonBodyCache;
        }
        $raw = $this->rawRequestBody();
        if (trim($raw) === '') {
            $this->jsonBodyCache = [];

            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiException('Invalid JSON body', 400);
        }
        $this->jsonBodyCache = $data;

        return $data;
    }

    /**
     * @param array<string, mixed>|list<mixed> $payload
     */
    public function json(int $status, $payload): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
            $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
        }
        $json = json_encode($payload, $flags);
        if ($json === false) {
            error_log('AngaraDAV portal JSON encode failed: ' . json_last_error_msg());
            $json = json_encode(['error' => 'Response encoding failed'], JSON_UNESCAPED_SLASHES) ?: '{"error":"Response encoding failed"}';
            http_response_code(500);
        }
        echo $json . "\n";
    }

    public function fileDownload(string $body, string $filename, string $contentType): void {
        $filename = preg_replace('/[^a-zA-Z0-9._-]+/', '-', $filename) ?: 'download';
        http_response_code(200);
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . (string) strlen($body));
        echo $body;
    }

    public function streamFileDownload(
        string $absolutePath,
        string $filename,
        string $contentType,
        int $size,
        string $etag,
        bool $inline = false
    ): void {
        $this->responseSent = true;
        $safe = preg_replace('/[^a-zA-Z0-9._ -]+/', '-', $filename) ?: 'download';
        $safe = trim($safe, '.- ') ?: 'download';
        $contentType = preg_replace('/[\r\n]+/', '', $contentType) ?: 'application/octet-stream';
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        while (ob_get_level() > 0) {
            @ob_end_clean();
        }
        http_response_code(200);
        header('Content-Type: ' . $contentType);
        $disposition = $inline ? 'inline' : 'attachment';
        header('Content-Disposition: ' . $disposition . '; filename="' . $safe . '"');
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        header('ETag: ' . $etag);
        if ($size >= 0) {
            header('Content-Length: ' . (string) $size);
        }
        $fp = fopen($absolutePath, 'rb');
        if ($fp === false) {
            throw new ApiException('Unable to read file', 500);
        }
        try {
            fpassthru($fp);
        } finally {
            fclose($fp);
        }
    }

    public function wantsImportProgressStream(): bool {
        $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));

        return str_contains($accept, 'application/x-ndjson')
            || (isset($_GET['progress']) && (string) $_GET['progress'] === '1');
    }

    /**
     * Stream NDJSON progress for long imports (each line is one JSON object).
     *
     * @param callable(?callable): array{imported: int, updated: int, skipped: int} $importFn
     */
    public function streamImportProgress(callable $importFn): void {
        $this->responseSent = true;

        while (ob_get_level() > 0) {
            @ob_end_clean();
        }
        @ini_set('zlib.output_compression', '0');
        @ini_set('implicit_flush', '1');
        if (function_exists('apache_setenv')) {
            @apache_setenv('no-gzip', '1');
        }

        http_response_code(200);
        header('Content-Type: application/x-ndjson; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('X-Accel-Buffering: no');

        $emit = static function (array $payload): void {
            $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
            if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
                $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
            }
            $line = json_encode($payload, $flags);
            if ($line === false) {
                $line = '{"type":"error","error":"Progress encode failed","status":500}';
            }
            echo $line . "\n";
            if (ob_get_level() > 0) {
                @ob_flush();
            }
            flush();
        };

        try {
            $emit([
                'type'     => 'progress',
                'current'  => 0,
                'total'    => 0,
                'percent'  => 0,
                'imported' => 0,
                'updated'  => 0,
                'skipped'  => 0,
            ]);

            $result = $importFn(static function (
                int $current,
                int $total,
                int $imported,
                int $updated,
                int $skipped
            ) use ($emit): void {
                $percent = $total > 0 ? (int) min(100, max(0, (int) round(100 * $current / $total))) : 0;
                $emit([
                    'type'     => 'progress',
                    'current'  => $current,
                    'total'    => $total,
                    'percent'  => $percent,
                    'imported' => $imported,
                    'updated'  => $updated,
                    'skipped'  => $skipped,
                ]);
            });
            $emit([
                'type'   => 'done',
                'result' => [
                    'imported' => (int) ($result['imported'] ?? 0),
                    'updated'  => (int) ($result['updated'] ?? 0),
                    'skipped'  => (int) ($result['skipped'] ?? 0),
                ],
            ]);
        } catch (ApiException $e) {
            $emit([
                'type'   => 'error',
                'error'  => $e->getMessage(),
                'status' => $e->getStatus(),
            ]);
        } catch (\Throwable $e) {
            error_log('AngaraDAV portal import stream: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            $msg = 'Internal server error';
            if (stripos($e->getMessage(), 'Maximum execution time') !== false) {
                $msg = 'Import timed out. Try a smaller export, or import again (already-imported items update faster).';
            } elseif (stripos($e->getMessage(), 'ob_flush') !== false) {
                $msg = 'Import progress flush failed; please retry after updating the image.';
            }
            $emit([
                'type'   => 'error',
                'error'  => $msg,
                'status' => 500,
            ]);
        }
    }
}
