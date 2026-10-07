<?php

require_once "cors.php";
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";
require_once "auth_tokens.php";
start_auth_session();

try {
    $userID = (int)($_SESSION["userID"] ?? 0);
    $usedRememberToken = false;

    if ($userID > 0 && time() - (int)($_SESSION['authStartedAt'] ?? 0) >= 8 * 60 * 60) {
        unset($_SESSION['userID'], $_SESSION['authStartedAt']);
        $userID = 0;
    }

    if ($userID <= 0) {
        $token = $_COOKIE[REMEMBER_COOKIE_NAME] ?? '';
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
            clear_remember_cookie();
            json_auth_failure('Your session has expired. Please log in again.', 401);
            $conn->close();
            exit;
        }

        ensure_remember_tokens_table($conn);
        $tokenHash = hash('sha256', $token);
        $stmt = $conn->prepare('SELECT userID FROM remember_tokens WHERE tokenHash = ? AND expiresAt > UTC_TIMESTAMP() LIMIT 1');
        if (!$stmt) {
            throw new RuntimeException('Unable to validate the persistent login token.');
        }
        $stmt->bind_param('s', $tokenHash);
        $stmt->execute();
        $result = $stmt->get_result();
        $tokenRow = $result->fetch_assoc();
        $stmt->close();

        if (!$tokenRow) {
            $delete = $conn->prepare('DELETE FROM remember_tokens WHERE tokenHash = ?');
            if (!$delete) {
                throw new RuntimeException('Unable to clear the expired persistent login token.');
            }
            $delete->bind_param('s', $tokenHash);
            if (!$delete->execute()) {
                $delete->close();
                throw new RuntimeException('Unable to clear the expired persistent login token.');
            }
            $delete->close();
            clear_remember_cookie();
            json_auth_failure('Your persistent login has expired. Please log in again.', 401);
            $conn->close();
            exit;
        }

        $userID = (int)$tokenRow['userID'];
        $usedRememberToken = true;
    }

    $user = load_auth_user($conn, $userID);
    if (!$user) {
        unset($_SESSION['userID']);
        clear_remember_cookie();
        json_auth_failure('This account is inactive or unavailable. Please log in again.', 401);
        $conn->close();
        exit;
    }

    if ($usedRememberToken) {
        session_regenerate_id(true);
        $_SESSION['userID'] = $userID;
        $_SESSION['authStartedAt'] = time();

        $newToken = bin2hex(random_bytes(32));
        $newTokenHash = hash('sha256', $newToken);
        $expiresAt = time() + REMEMBER_TOKEN_LIFETIME_DAYS * 86400;
        $expiresAtSql = gmdate('Y-m-d H:i:s', $expiresAt);
        $rotate = $conn->prepare('UPDATE remember_tokens SET tokenHash = ?, expiresAt = ? WHERE tokenHash = ?');
        if (!$rotate) {
            throw new RuntimeException('Unable to renew the persistent login token.');
        }
        $rotate->bind_param('sss', $newTokenHash, $expiresAtSql, $tokenHash);
        if (!$rotate->execute() || $rotate->affected_rows !== 1) {
            $rotate->close();
            clear_remember_cookie();
            unset($_SESSION['userID']);
            json_auth_failure('Your persistent login has expired. Please log in again.', 401);
            $conn->close();
            exit;
        }
        $rotate->close();
        set_remember_cookie($newToken, $expiresAt);
    }

    echo json_encode(['success' => true, 'user' => $user]);
    $conn->close();
} catch (Throwable $error) {
    error_log('Auth session validation failed: ' . $error->getMessage());
    json_auth_failure('Unable to verify your login session. Please try again.', 500);
    $conn->close();
}
