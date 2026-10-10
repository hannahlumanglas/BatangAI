<?php

const REMEMBER_COOKIE_NAME = 'batangai_remember';
const REMEMBER_TOKEN_LIFETIME_DAYS = 30;

function start_auth_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string)(8 * 60 * 60));
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function ensure_remember_tokens_table(mysqli $conn): void
{
    $sql = "CREATE TABLE IF NOT EXISTS remember_tokens (
        tokenHash CHAR(64) NOT NULL PRIMARY KEY,
        userID INT NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_remember_tokens_user (userID),
        INDEX idx_remember_tokens_expiry (expiresAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    if (!$conn->query($sql)) {
        throw new RuntimeException('Unable to prepare persistent login storage.');
    }
}

function set_remember_cookie(string $token, int $expiresAt): void
{
    setcookie(REMEMBER_COOKIE_NAME, $token, [
        'expires' => $expiresAt,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clear_remember_cookie(): void
{
    setcookie(REMEMBER_COOKIE_NAME, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function revoke_remember_cookie(mysqli $conn): void
{
    $token = $_COOKIE[REMEMBER_COOKIE_NAME] ?? '';
    if (is_string($token) && $token !== '') {
        $stmt = $conn->prepare('DELETE FROM remember_tokens WHERE tokenHash = ?');
        if (!$stmt) {
            throw new RuntimeException('Unable to revoke the persistent login token.');
        }
        $tokenHash = hash('sha256', $token);
        $stmt->bind_param('s', $tokenHash);
        if (!$stmt->execute()) {
            $stmt->close();
            throw new RuntimeException('Unable to revoke the persistent login token.');
        }
        $stmt->close();
    }

    clear_remember_cookie();
}

function issue_remember_cookie(mysqli $conn, int $userID): void
{
    ensure_remember_tokens_table($conn);
    revoke_remember_cookie($conn);

    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = time() + REMEMBER_TOKEN_LIFETIME_DAYS * 86400;
    $expiresAtSql = gmdate('Y-m-d H:i:s', $expiresAt);

    $stmt = $conn->prepare('INSERT INTO remember_tokens (tokenHash, userID, expiresAt) VALUES (?, ?, ?)');
    if (!$stmt) {
        throw new RuntimeException('Unable to create the persistent login token.');
    }
    $stmt->bind_param('sis', $tokenHash, $userID, $expiresAtSql);
    if (!$stmt->execute()) {
        $stmt->close();
        throw new RuntimeException('Unable to save the persistent login token.');
    }
    $stmt->close();
    set_remember_cookie($token, $expiresAt);
}

function load_auth_user(mysqli $conn, int $userID): ?array
{
    $stmt = $conn->prepare('SELECT userID, dateCreated, department, email, employeeId, fullName, profilePhoto, role, status FROM users WHERE userID = ? LIMIT 1');
    if (!$stmt) {
        throw new RuntimeException('Unable to load the authenticated account.');
    }
    $stmt->bind_param('i', $userID);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc() ?: null;
    $stmt->close();

    if (!$user || strtolower(trim((string)$user['status'])) !== 'active') {
        return null;
    }

    $roleMap = [
        'admin' => 'Administrator',
        'administrator' => 'Administrator',
        'secretary' => 'Secretary',
        'it support' => 'IT Personnel',
        'it personnel' => 'IT Personnel',
        'employee' => 'Employee',
    ];
    $role = strtolower(trim((string)$user['role']));
    if (!isset($roleMap[$role])) {
        return null;
    }
    $user['role'] = $roleMap[$role];
    if (!empty($user['profilePhoto']) && str_contains((string)$user['profilePhoto'], '/')) {
        $user['profilePhoto'] = basename((string)$user['profilePhoto']);
    }
    return $user;
}

function require_admin_session(mysqli $conn): bool
{
    start_auth_session();
    $userID = (int)($_SESSION['userID'] ?? 0);
    if ($userID <= 0) {
        json_auth_failure('Please log in with an Administrator account.', 401);
        return false;
    }

    $user = load_auth_user($conn, $userID);
    if (!$user) {
        json_auth_failure('This account is inactive or unavailable. Please log in again.', 401);
        return false;
    }
    if ($user['role'] !== 'Administrator') {
        json_auth_failure('Only an Administrator can manage accounts.', 403);
        return false;
    }

    return true;
}

function json_auth_failure(string $message, int $status): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message]);
}
