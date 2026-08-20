<?php

namespace Baikal\Portal\Install;

use Baikal\Portal\ApiException;
use Baikal\Portal\Auth;
use Baikal\Portal\SameOrigin;

/**
 * JSON router for unauthenticated install/upgrade API under /api/install/*.
 */
class InstallApp {
    /** @var InstallService */
    private $service;

    /** @var array<string, mixed>|null */
    private $jsonBodyCache;

    public function __construct(?InstallService $service = null) {
        $this->service = $service ?? new InstallService();
    }

    public static function bootstrap(): self {
        if (!defined('PROJECT_PATH_ROOT')) {
            throw new ApiException('PROJECT_PATH_ROOT not defined', 500);
        }
        if (!defined('BAIKAL_CONTEXT')) {
            define('BAIKAL_CONTEXT', true);
        }
        if (!defined('BAIKAL_CONTEXT_INSTALL')) {
            define('BAIKAL_CONTEXT_INSTALL', true);
        }
        if (!defined('PROJECT_CONTEXT_BASEURI')) {
            define('PROJECT_CONTEXT_BASEURI', '/');
        }

        // Portal session cookie for install CSRF (must start before Flake)
        Auth::startSession();

        \Flake\Framework::bootstrap();
        if (!defined('BAIKALADMIN_PATH_ROOT')) {
            define('BAIKALADMIN_PATH_ROOT', PROJECT_PATH_ROOT . 'Core/Frameworks/BaikalAdmin/');
        }
        \Baikal\Framework::bootstrap();

        return new self();
    }

    public function handle(string $method, string $path): void {
        $method = strtoupper($method);
        $path = '/' . trim($path, '/');
        if ($path === '/') {
            $path = '';
        }

        if ($path === '/install' || str_starts_with($path, '/install/')) {
            $sub = $path === '/install' ? '' : substr($path, strlen('/install'));
            $sub = '/' . trim((string) $sub, '/');
            if ($sub === '/') {
                $sub = '';
            }
        } else {
            $this->json(404, ['error' => 'Not found']);

            return;
        }

        try {
            $result = $this->dispatch($method, $sub);
            $this->json(200, $result);
        } catch (ApiException $e) {
            $this->json($e->getStatus(), ['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('install api: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            $this->json(500, ['error' => 'Internal server error']);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function dispatch(string $method, string $sub): array {
        if ($method === 'GET' && ($sub === '' || $sub === '/status')) {
            return ['data' => $this->service->status()];
        }

        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $this->assertSameOrigin();
            $this->service->assertCsrf($this->csrfFromRequest());
        }

        if ($method === 'POST' && $sub === '/initialize') {
            return ['data' => $this->service->initialize($this->jsonBody())];
        }
        if ($method === 'POST' && $sub === '/database') {
            return ['data' => $this->service->configureDatabase($this->jsonBody())];
        }
        if ($method === 'POST' && $sub === '/upgrade') {
            $body = $this->jsonBody();
            $confirm = !empty($body['confirm']) && $body['confirm'] !== '0' && $body['confirm'] !== 'false';

            return ['data' => $this->service->upgrade($confirm)];
        }

        throw new ApiException('Not found', 404);
    }

    /**
     * @return array<string, mixed>
     */
    private function jsonBody(): array {
        if ($this->jsonBodyCache !== null) {
            return $this->jsonBodyCache;
        }
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            $this->jsonBodyCache = [];

            return $this->jsonBodyCache;
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiException('Invalid JSON body', 400);
        }
        $this->jsonBodyCache = $data;

        return $this->jsonBodyCache;
    }

    private function csrfFromRequest(): string {
        $h = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_SERVER['HTTP_X_BAIKAL_CSRF'] ?? '';
        if (is_string($h) && $h !== '') {
            return $h;
        }
        $body = $this->jsonBody();
        $t = $body['csrfToken'] ?? $body['csrf'] ?? '';

        return is_string($t) ? $t : '';
    }

    private function assertSameOrigin(): void {
        SameOrigin::assert($_SERVER);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function json(int $status, array $payload): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES) . "\n";
    }
}
