<?php

require_once __DIR__ . '/cors.php';
header('Access-Control-Allow-Methods: GET, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    exit;
}

require_once __DIR__ . '/config.php';

try {
    $requestedName = trim((string)($_GET['filename'] ?? ''));
    $fileName = basename(str_replace('\\', '/', $requestedName));
    if ($fileName === '' || $fileName !== $requestedName || !preg_match('/^[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/i', $fileName)) {
        http_response_code(404);
        $conn->close();
        exit;
    }

    $stmt = $conn->prepare('SELECT 1 FROM users WHERE profilePhoto = ? LIMIT 1');
    if (!$stmt) {
        throw new RuntimeException('Unable to validate the profile photo.');
    }
    $stmt->bind_param('s', $fileName);
    $stmt->execute();
    $isRegisteredPhoto = (bool)$stmt->get_result()->fetch_row();
    $stmt->close();

    $filePath = __DIR__ . '/../uploads/profile_photos/' . $fileName;
    if (!$isRegisteredPhoto || !is_file($filePath) || !is_readable($filePath)) {
        http_response_code(404);
        $conn->close();
        exit;
    }

    $imageInfo = @getimagesize($filePath);
    $mimeType = $imageInfo['mime'] ?? '';
    if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        http_response_code(404);
        $conn->close();
        exit;
    }

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: private, max-age=3600');
    header('X-Content-Type-Options: nosniff');
    readfile($filePath);
    $conn->close();
} catch (Throwable $error) {
    error_log('Profile photo request failed: ' . $error->getMessage());
    http_response_code(500);
    $conn->close();
}

