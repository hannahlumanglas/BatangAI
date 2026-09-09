<?php

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'config.php';

function respond($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function ensureDevicesTable($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS devices (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        deviceID VARCHAR(30) DEFAULT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        deviceType VARCHAR(50) NOT NULL,
        status ENUM('online', 'warning', 'offline') NOT NULL DEFAULT 'online',
        ipAddress VARCHAR(45) NOT NULL UNIQUE,
        macAddress VARCHAR(17) DEFAULT NULL,
        location VARCHAR(255) NOT NULL,
        department VARCHAR(150) NOT NULL,
        firmware VARCHAR(100) DEFAULT NULL,
        assignedUserId INT(11) DEFAULT NULL,
        throughput TINYINT UNSIGNED NOT NULL DEFAULT 0,
        devicesConnected INT UNSIGNED NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        lastSeen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_devices_assigned_user FOREIGN KEY (assignedUserId) REFERENCES users(userID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if (!$conn->query($sql)) {
        respond(['success' => false, 'message' => 'Unable to initialize device monitoring storage.'], 500);
    }
}

function formatUptime($createdAt) {
    $seconds = max(0, time() - strtotime($createdAt));
    $days = intdiv($seconds, 86400);
    $hours = intdiv($seconds % 86400, 3600);
    $minutes = intdiv($seconds % 3600, 60);
    if ($days > 0) return $days . 'd ' . $hours . 'h';
    if ($hours > 0) return $hours . 'h ' . $minutes . 'm';
    return $minutes . 'm';
}

function deviceFromRow($row) {
    return [
        'id' => $row['deviceID'],
        'name' => $row['name'],
        'type' => $row['deviceType'],
        'status' => $row['status'],
        'ip' => $row['ipAddress'],
        'mac' => $row['macAddress'] ?: '—',
        'location' => $row['location'],
        'department' => $row['department'],
        'firmware' => $row['firmware'] ?: '—',
        'lastSeen' => $row['lastSeen'],
        'throughput' => (int)$row['throughput'],
        'devicesConnected' => (int)$row['devicesConnected'],
        'uptime' => $row['status'] === 'offline' ? '—' : formatUptime($row['createdAt']),
        'assignedUserId' => $row['assignedUserId'] === null ? null : (string)$row['assignedUserId'],
        'assignedUserName' => $row['assignedUserName'],
    ];
}

function fetchDevice($conn, $deviceId) {
    $stmt = $conn->prepare("SELECT d.*, u.fullName AS assignedUserName
        FROM devices d LEFT JOIN users u ON u.userID = d.assignedUserId
        WHERE d.deviceID = ? LIMIT 1");
    $stmt->bind_param('s', $deviceId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return $row ? deviceFromRow($row) : null;
}

ensureDevicesTable($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query("SELECT d.*, u.fullName AS assignedUserName
        FROM devices d LEFT JOIN users u ON u.userID = d.assignedUserId
        ORDER BY d.createdAt DESC, d.id DESC");
    if (!$result) respond(['success' => false, 'message' => 'Unable to load devices.'], 500);

    $devices = [];
    while ($row = $result->fetch_assoc()) $devices[] = deviceFromRow($row);
    $conn->close();
    respond(['success' => true, 'devices' => $devices]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $conn->close();
    respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || ($data['action'] ?? '') !== 'add') {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid device request.'], 400);
}

$name = trim((string)($data['name'] ?? ''));
$type = trim((string)($data['type'] ?? ''));
$status = trim((string)($data['status'] ?? 'online'));
$ip = trim((string)($data['ip'] ?? ''));
$mac = trim((string)($data['mac'] ?? ''));
$location = trim((string)($data['location'] ?? ''));
$department = trim((string)($data['department'] ?? ''));
$firmware = trim((string)($data['firmware'] ?? ''));
$throughput = (int)($data['throughput'] ?? 0);
$devicesConnected = (int)($data['devicesConnected'] ?? 0);
$assignedUserId = trim((string)($data['assignedUserId'] ?? ''));

if ($name === '' || $location === '' || $department === '' || !filter_var($ip, FILTER_VALIDATE_IP)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Please provide a device name, valid IP address, location, and department.'], 400);
}
if (!in_array($type, ['Router', 'Switch', 'Access Point'], true) || !in_array($status, ['online', 'warning', 'offline'], true)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid device type or status.'], 400);
}
if ($mac !== '' && $mac !== '—' && !preg_match('/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/', $mac)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid MAC address format.'], 400);
}
if ($assignedUserId !== '' && !ctype_digit($assignedUserId)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid assigned user.'], 400);
}
if ($assignedUserId !== '') {
    $userCheck = $conn->prepare('SELECT userID FROM users WHERE userID = ? AND status = \'Active\' LIMIT 1');
    $userCheck->bind_param('i', $assignedUserId);
    $userCheck->execute();
    if ($userCheck->get_result()->num_rows === 0) {
        $userCheck->close();
        $conn->close();
        respond(['success' => false, 'message' => 'The selected user is no longer active.'], 400);
    }
    $userCheck->close();
}

$assignedUser = $assignedUserId === '' ? null : (int)$assignedUserId;
$mac = $mac === '—' ? '' : $mac;
$firmware = $firmware === '—' ? '' : $firmware;
$throughput = max(0, min(100, $throughput));
$devicesConnected = max(0, $devicesConnected);

$stmt = $conn->prepare('INSERT INTO devices (name, deviceType, status, ipAddress, macAddress, location, department, firmware, assignedUserId, throughput, devicesConnected) VALUES (?, ?, ?, ?, NULLIF(?, \'\'), ?, ?, NULLIF(?, \'\'), ?, ?, ?)');
$stmt->bind_param('ssssssssiii', $name, $type, $status, $ip, $mac, $location, $department, $firmware, $assignedUser, $throughput, $devicesConnected);
if (!$stmt->execute()) {
    $databaseError = $stmt->errno;
    $message = $databaseError === 1062 ? 'A device already uses that IP address.' : 'Unable to add the device.';
    $stmt->close();
    $conn->close();
    respond(['success' => false, 'message' => $message], $databaseError === 1062 ? 409 : 500);
}

$numericId = $conn->insert_id;
$deviceId = 'DEV-' . str_pad((string)$numericId, 3, '0', STR_PAD_LEFT);
$update = $conn->prepare('UPDATE devices SET deviceID = ? WHERE id = ?');
$update->bind_param('si', $deviceId, $numericId);
$update->execute();
$update->close();
$stmt->close();

$device = fetchDevice($conn, $deviceId);
$conn->close();
respond(['success' => true, 'device' => $device], 201);
