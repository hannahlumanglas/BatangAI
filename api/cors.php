<?php

// Keep this list explicit.  Add the LAN address of the computer running Vite
// when teammates open the frontend from their own devices.
$configuredOrigins = getenv('CORS_ALLOWED_ORIGINS') ?: '';
$allowedOrigins = array_filter(array_map('trim', array_merge(
    ['http://localhost:5173', 'http://127.0.0.1:5173'],
    $configuredOrigins === '' ? [] : explode(',', $configuredOrigins)
)));

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
}

