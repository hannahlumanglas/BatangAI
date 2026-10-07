<?php

require_once "cors.php";
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";
require_once "auth_tokens.php";
start_auth_session();

$revokeError = null;
try {
    if (!empty($_COOKIE[REMEMBER_COOKIE_NAME])) {
        ensure_remember_tokens_table($conn);
        revoke_remember_cookie($conn);
    } else {
        clear_remember_cookie();
    }
} catch (Throwable $error) {
    error_log('Remember token revocation failed: ' . $error->getMessage());
    $revokeError = $error;
    clear_remember_cookie();
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'] ?: '/',
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => 'Lax',
    ]);
}
session_destroy();

if ($revokeError) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not revoke the persistent login token. Contact an administrator.',
    ]);
} else {
    echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
}

$conn->close();
