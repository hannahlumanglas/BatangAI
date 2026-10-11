<?php

require_once __DIR__ . '/load_env.php';
$configuredOrigins = getenv('CORS_ALLOWED_ORIGINS') ?: '';
$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $configuredOrigins))));

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
