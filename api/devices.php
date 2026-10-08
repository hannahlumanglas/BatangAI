<?php

require_once "cors.php";
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
        status ENUM('online', 'warning', 'offline') NOT NULL DEFAULT 'offline',
        ipAddress VARCHAR(45) NOT NULL UNIQUE,
        macAddress VARCHAR(17) DEFAULT NULL,
        location VARCHAR(255) NOT NULL,
        department VARCHAR(150) NOT NULL,
        firmware VARCHAR(100) DEFAULT NULL,
        assignedUserId INT(11) DEFAULT NULL,
        throughput TINYINT UNSIGNED DEFAULT NULL,
        devicesConnected INT UNSIGNED DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        lastSeen DATETIME DEFAULT NULL,
        monitoringStatus ENUM('unknown', 'online', 'offline') NOT NULL DEFAULT 'unknown',
        pingResponseTimeMs VARCHAR(20) DEFAULT NULL,
        lastPingAt DATETIME DEFAULT NULL,
        uptimeSeconds BIGINT UNSIGNED DEFAULT NULL,
        downloadMbps DECIMAL(12,3) DEFAULT NULL,
        uploadMbps DECIMAL(12,3) DEFAULT NULL,
        CONSTRAINT fk_devices_assigned_user FOREIGN KEY (assignedUserId) REFERENCES users(userID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if (!$conn->query($sql)) {
        respond(['success' => false, 'message' => 'Unable to initialize device monitoring storage.'], 500);
    }

    $columns = [
        'monitoringStatus' => "ENUM('unknown', 'online', 'offline') NOT NULL DEFAULT 'unknown'",
        'pingResponseTimeMs' => 'VARCHAR(20) DEFAULT NULL',
        'lastPingAt' => 'DATETIME DEFAULT NULL',
        'uptimeSeconds' => 'BIGINT UNSIGNED DEFAULT NULL',
        'downloadMbps' => 'DECIMAL(12,3) DEFAULT NULL',
        'uploadMbps' => 'DECIMAL(12,3) DEFAULT NULL',
    ];
    foreach ($columns as $column => $definition) {
        $existing = $conn->query("SHOW COLUMNS FROM devices LIKE '{$column}'");
        if (!$existing || $existing->num_rows === 0) {
            if (!$conn->query("ALTER TABLE devices ADD COLUMN {$column} {$definition}")) {
                respond(['success' => false, 'message' => 'Unable to upgrade device monitoring storage.'], 500);
            }
        }
    }
    $lastSeenColumn = $conn->query("SHOW COLUMNS FROM devices LIKE 'lastSeen'");
    $lastSeenInfo = $lastSeenColumn ? $lastSeenColumn->fetch_assoc() : null;
    if ($lastSeenInfo && $lastSeenInfo['Null'] !== 'YES' && !$conn->query('ALTER TABLE devices MODIFY COLUMN lastSeen DATETIME DEFAULT NULL')) {
        respond(['success' => false, 'message' => 'Unable to upgrade device monitoring storage.'], 500);
    }
    $legacyMetricTypes = [
        'throughput' => 'TINYINT UNSIGNED',
        'devicesConnected' => 'INT UNSIGNED',
    ];
    foreach ($legacyMetricTypes as $legacyMetric => $legacyType) {
        $legacyColumn = $conn->query("SHOW COLUMNS FROM devices LIKE '{$legacyMetric}'");
        $legacyInfo = $legacyColumn ? $legacyColumn->fetch_assoc() : null;
        if ($legacyInfo && $legacyInfo['Null'] !== 'YES') {
            if (!$conn->query("ALTER TABLE devices MODIFY COLUMN {$legacyMetric} {$legacyType} DEFAULT NULL")) {
                respond(['success' => false, 'message' => 'Unable to upgrade legacy device metrics.'], 500);
            }
            $conn->query("UPDATE devices SET {$legacyMetric} = NULL WHERE {$legacyMetric} = 0");
        }
    }

    $historySql = "CREATE TABLE IF NOT EXISTS device_status_history (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        deviceID VARCHAR(40) NOT NULL,
        deviceName VARCHAR(150) NOT NULL,
        ipAddress VARCHAR(45) NOT NULL,
        status ENUM('online', 'offline') NOT NULL,
        checkedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_status_history_time (checkedAt, id),
        INDEX idx_device_status_history_device (deviceID, checkedAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    if (!$conn->query($historySql)) {
        respond(['success' => false, 'message' => 'Unable to initialize device status history.'], 500);
    }
}

function formatUptime($uptimeSeconds) {
    if ($uptimeSeconds === null) return null;
    $seconds = max(0, (int)$uptimeSeconds);
    $days = intdiv($seconds, 86400);
    $hours = intdiv($seconds % 86400, 3600);
    $minutes = intdiv($seconds % 3600, 60);
    if ($days > 0) return $days . 'd ' . $hours . 'h ' . $minutes . 'm';
    if ($hours > 0) return $hours . 'h ' . $minutes . 'm';
    return $minutes . 'm';
}

function pingHost($ip) {
    if (!filter_var($ip, FILTER_VALIDATE_IP) || !function_exists('exec')) {
        return ['available' => false, 'reachable' => false, 'responseTimeMs' => null];
    }
    $pingPath = PHP_OS_FAMILY === 'Windows'
        ? (getenv('SystemRoot') . '\\System32\\ping.exe')
        : (is_executable('/usr/bin/ping') ? '/usr/bin/ping' : '/bin/ping');
    if (!is_executable($pingPath)) {
        return ['available' => false, 'reachable' => false, 'responseTimeMs' => null];
    }
    $command = PHP_OS_FAMILY === 'Windows'
        ? escapeshellarg($pingPath) . ' -n 1 -w 2000 ' . escapeshellarg($ip)
        : escapeshellarg($pingPath) . ' -n -c 1 -W 2 ' . escapeshellarg($ip);
    for ($attempt = 0; $attempt < 2; $attempt++) {
        $output = [];
        $exitCode = 1;
        exec($command, $output, $exitCode);
        if ($exitCode === 0) {
            foreach ($output as $line) {
                if (preg_match('/time[=<]\\s*([\\d.,]+)\\s*ms/i', $line, $matches)) {
                    return ['available' => true, 'reachable' => true, 'responseTimeMs' => str_replace(',', '.', $matches[1])];
                }
            }
            return ['available' => true, 'reachable' => true, 'responseTimeMs' => null];
        }
    }
    return ['available' => true, 'reachable' => false, 'responseTimeMs' => null];
}

function deviceFromRow($row) {
    // These router metrics intentionally remain unavailable until the API host
    // can query a documented, authenticated router API or configured read-only
    // SNMP agent. The router's admin UI is not reachable from this execution
    // environment, so no firmware-specific endpoint or SNMP data source has
    // been verified. Never substitute app device counts or 0.
    return [
        'id' => $row['deviceID'],
        'name' => $row['name'],
        'type' => $row['deviceType'],
        'status' => $row['monitoringStatus'] ?? 'unknown',
        'ip' => $row['ipAddress'],
        'mac' => $row['macAddress'] ?: '—',
        'location' => $row['location'],
        'department' => $row['department'],
        'firmware' => $row['firmware'] ?: '—',
        'registeredAt' => $row['createdAt'],
        'lastSeen' => $row['lastPingAt'] === null ? null : $row['lastSeen'],
        'throughput' => null,
        'devicesConnected' => null,
        'uptime' => null,
        'downloadMbps' => null,
        'uploadMbps' => null,
        'pingResponseTimeMs' => $row['pingResponseTimeMs'],
        'lastPingAt' => $row['lastPingAt'],
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
    while ($row = $result->fetch_assoc()) {
        $devices[] = deviceFromRow($row);
    }
    $conn->close();
    respond(['success' => true, 'devices' => $devices]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $conn->close();
    respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid device request.'], 400);
}

if (($data['action'] ?? '') === 'ping') {
    $deviceId = trim((string)($data['deviceID'] ?? ''));
    if ($deviceId === '') {
        $conn->close();
        respond(['success' => false, 'message' => 'Device ID is required.'], 400);
    }

    $lookup = $conn->prepare('SELECT ipAddress, name, monitoringStatus FROM devices WHERE deviceID = ? LIMIT 1');
    $lookup->bind_param('s', $deviceId);
    $lookup->execute();
    $deviceRow = $lookup->get_result()->fetch_assoc();
    $lookup->close();
    if (!$deviceRow) {
        $conn->close();
        respond(['success' => false, 'message' => 'Device not found.'], 404);
    }

    $probeResult = pingHost($deviceRow['ipAddress']);
    if (!$probeResult['available']) {
        $conn->close();
        respond(['success' => false, 'message' => 'Ping is unavailable on this server.'], 501);
    }
    $reachable = $probeResult['reachable'];
    $status = $reachable ? 'online' : 'offline';
    $responseTime = $probeResult['responseTimeMs'];
    $statusChanged = strtolower((string)$deviceRow['monitoringStatus']) !== $status;
    $previousEvent = $conn->prepare('SELECT status FROM device_status_history WHERE deviceID = ? ORDER BY checkedAt DESC, id DESC LIMIT 1');
    $previousEvent->bind_param('s', $deviceId);
    $previousEvent->execute();
    $previousStatus = $previousEvent->get_result()->fetch_assoc();
    $previousEvent->close();
    $shouldRecordStatus = $statusChanged || !$previousStatus || $previousStatus['status'] !== $status;
    $update = $conn->prepare("UPDATE devices SET status = ?, monitoringStatus = ?, pingResponseTimeMs = ?, lastPingAt = CURRENT_TIMESTAMP, lastSeen = IF(? = 'online', CURRENT_TIMESTAMP, lastSeen) WHERE deviceID = ?");
    $update->bind_param('sssss', $status, $status, $responseTime, $status, $deviceId);
    $update->execute();
    $update->close();

    if ($shouldRecordStatus) {
        $history = $conn->prepare(
            'INSERT INTO device_status_history (deviceID, deviceName, ipAddress, status, checkedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        );
        if ($history) {
            $history->bind_param('ssss', $deviceId, $deviceRow['name'], $deviceRow['ipAddress'], $status);
            $history->execute();
            $history->close();
        }
    }

    $saved = $conn->prepare('SELECT lastSeen, lastPingAt FROM devices WHERE deviceID = ? LIMIT 1');
    $saved->bind_param('s', $deviceId);
    $saved->execute();
    $savedResult = $saved->get_result()->fetch_assoc();
    $saved->close();

    $conn->close();
    respond([
        'success' => true,
        'reachable' => $reachable,
        'status' => $status,
        'responseTimeMs' => $responseTime,
        'lastSeen' => $savedResult['lastSeen'],
        'lastPingAt' => $savedResult['lastPingAt'],
        'message' => $reachable ? 'Reachable.' : 'Timeout after 2 attempts.',
    ]);
}

if (($data['action'] ?? '') === 'delete') {
    $deviceId = trim((string)($data['deviceID'] ?? ''));
    if ($deviceId === '') {
        $conn->close();
        respond(['success' => false, 'message' => 'Device ID is required.'], 400);
    }

    $delete = $conn->prepare('DELETE FROM devices WHERE deviceID = ?');
    $delete->bind_param('s', $deviceId);
    if (!$delete->execute()) {
        $delete->close();
        $conn->close();
        respond(['success' => false, 'message' => 'Unable to delete the device.'], 500);
    }
    $deleted = $delete->affected_rows > 0;
    $delete->close();
    $conn->close();
    if (!$deleted) {
        respond(['success' => false, 'message' => 'Device not found.'], 404);
    }
    respond(['success' => true, 'message' => 'Device deleted.']);
}

if (($data['action'] ?? '') !== 'add') {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid device request.'], 400);
}

$name = trim((string)($data['name'] ?? ''));
$type = trim((string)($data['type'] ?? ''));
$status = 'offline';
$monitoringStatus = 'unknown';
$ip = trim((string)($data['ip'] ?? ''));
$mac = trim((string)($data['mac'] ?? ''));
$location = trim((string)($data['location'] ?? ''));
$department = trim((string)($data['department'] ?? ''));
$firmware = trim((string)($data['firmware'] ?? ''));
$assignedUserId = trim((string)($data['assignedUserId'] ?? ''));

if ($name === '' || $location === '' || $department === '' || $firmware === '' || !filter_var($ip, FILTER_VALIDATE_IP)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Please provide a device name, valid IP address, location, department, and firmware version.'], 400);
}
if (!in_array($type, ['Router', 'Switch', 'Access Point'], true)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid device type.'], 400);
}
if (!preg_match('/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/', $mac)) {
    $conn->close();
    respond(['success' => false, 'message' => 'A valid MAC address is required (e.g. AC:DE:48:00:11:22).'], 400);
}
if ($assignedUserId !== '' && !ctype_digit($assignedUserId)) {
    $conn->close();
    respond(['success' => false, 'message' => 'Invalid assigned user.'], 400);
}
if ($assignedUserId !== '') {
    $userCheck = $conn->prepare("SELECT userID FROM users WHERE userID = ? AND LOWER(status) = 'active' AND LOWER(role) = 'employee' LIMIT 1");
    $userCheck->bind_param('i', $assignedUserId);
    $userCheck->execute();
    if ($userCheck->get_result()->num_rows === 0) {
        $userCheck->close();
        $conn->close();
        respond(['success' => false, 'message' => 'The selected employee is no longer active or is not an employee.'], 400);
    }
    $userCheck->close();
}

$assignedUser = $assignedUserId === '' ? null : (int)$assignedUserId;
$stmt = $conn->prepare("INSERT INTO devices (name, deviceType, status, ipAddress, macAddress, location, department, firmware, assignedUserId, monitoringStatus, pingResponseTimeMs, lastPingAt, lastSeen) VALUES (?, ?, ?, ?, NULLIF(?, ''), ?, ?, NULLIF(?, ''), ?, ?, NULL, NULL, NULL)");
$stmt->bind_param('ssssssssis', $name, $type, $status, $ip, $mac, $location, $department, $firmware, $assignedUser, $monitoringStatus);
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
