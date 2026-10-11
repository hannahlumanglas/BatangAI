<?php

require_once 'cors.php';
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}

require_once 'config.php';
require_once 'auth_tokens.php';

$sessionUser = require_role_session($conn, ['Administrator'], 'Only an Administrator can view device status reports.');
if ($sessionUser === null) { $conn->close(); exit; }
$userID = (string)$sessionUser['userID'];
$requestedUserID = trim((string)($_GET['userID'] ?? ''));
$startDate = trim((string)($_GET['startDate'] ?? ''));
$endDate = trim((string)($_GET['endDate'] ?? ''));
if ($requestedUserID !== '' && $requestedUserID !== $userID) {
    $conn->close();
    respond(['success' => false, 'message' => 'The requested account does not match the authenticated session.'], 403);
}

$validDate = function ($value) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return false;
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value;
};
if (!$validDate($startDate) || !$validDate($endDate) || $startDate > $endDate) {
    $conn->close();
    respond(['success' => false, 'message' => 'A valid start and end date are required.'], 400);
}

$table = "CREATE TABLE IF NOT EXISTS device_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    deviceID VARCHAR(40) NOT NULL,
    deviceName VARCHAR(150) NOT NULL,
    ipAddress VARCHAR(45) NOT NULL,
    status ENUM('online', 'offline') NOT NULL,
    checkedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_status_history_time (checkedAt, id),
    INDEX idx_device_status_history_device (deviceID, checkedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
if (!$conn->query($table)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Unable to initialize device status history.'], 500);
}

$stmt = $conn->prepare(
    "SELECT deviceID, deviceName, ipAddress, status, checkedAt
     FROM device_status_history
     WHERE checkedAt >= CONCAT(?, ' 00:00:00')
       AND checkedAt < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL 1 DAY)
     ORDER BY checkedAt DESC, id DESC"
);
if (!$stmt) {
    $conn->close();
    respond(['success' => false, 'message' => 'Unable to prepare the device status report.'], 500);
}
$stmt->bind_param('ss', $startDate, $endDate);
$stmt->execute();
$events = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$conn->close();
respond(['success' => true, 'events' => $events]);
