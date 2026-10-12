<?php
require_once __DIR__ . '/cors.php';
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_tokens.php';

try {
    $user = require_role_session($conn, ['Administrator', 'Secretary', 'IT Personnel', 'Employee']);
    if (!$user) exit;

    $conn->query("CREATE TABLE IF NOT EXISTS user_app_data (
        userID BIGINT UNSIGNED NOT NULL,
        dataKey VARCHAR(80) NOT NULL,
        dataValue LONGTEXT NOT NULL,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (userID, dataKey)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $stmt = $conn->prepare('SELECT dataKey, dataValue FROM user_app_data WHERE userID = ?');
        $stmt->bind_param('i', $user['userID']);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $decoded = json_decode($row['dataValue'], true);
            $data[$row['dataKey']] = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
        }
        $stmt->close();
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }

    if ($method === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true);
        $key = is_array($body) ? ($body['key'] ?? '') : '';
        $value = is_array($body) ? ($body['value'] ?? null) : null;
        $allowedKeys = ['incident_report_draft', 'notification_read_ids', 'notification_initialized'];
        if (!is_string($key) || !in_array($key, $allowedKeys, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid data key.']);
            exit;
        }
        if ($key === 'incident_report_draft' && $value !== null && !is_array($value)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid incident draft.']);
            exit;
        }
        if ($key === 'notification_read_ids' && (!is_array($value) || count($value) > 1000)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid notification read state.']);
            exit;
        }
        if ($key === 'notification_initialized' && !is_bool($value)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid notification state.']);
            exit;
        }

        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded === false || strlen($encoded) > 200000) {
            http_response_code(413);
            echo json_encode(['success' => false, 'message' => 'The data is too large to save.']);
            exit;
        }
        $stmt = $conn->prepare('INSERT INTO user_app_data (userID, dataKey, dataValue) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE dataValue = VALUES(dataValue)');
        $stmt->bind_param('iss', $user['userID'], $key, $encoded);
        $ok = $stmt->execute();
        $stmt->close();
        if (!$ok) throw new RuntimeException('Unable to save user data.');
        echo json_encode(['success' => true]);
        exit;
    }

    if ($method === 'DELETE') {
        $body = json_decode(file_get_contents('php://input'), true);
        $key = is_array($body) ? ($body['key'] ?? '') : '';
        if ($key !== 'incident_report_draft') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid data key.']);
            exit;
        }
        $stmt = $conn->prepare('DELETE FROM user_app_data WHERE userID = ? AND dataKey = ?');
        $stmt->bind_param('is', $user['userID'], $key);
        $ok = $stmt->execute();
        $stmt->close();
        if (!$ok) throw new RuntimeException('Unable to delete the submitted draft.');
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
} catch (Throwable $error) {
    error_log('User app data error: ' . $error->getMessage());
    if (!headers_sent()) http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to access saved user data.']);
}
