<?php

require_once __DIR__ . '/load_env.php';
$requiredDatabaseSettings = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
foreach ($requiredDatabaseSettings as $setting) {
    if (getenv($setting) === false) {
        error_log('Database configuration is missing ' . $setting . '.');
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        die(json_encode(['success' => false, 'message' => 'Database configuration is incomplete. Configure the server environment.']));
    }
}

$host = getenv('DB_HOST');
$dbname = getenv('DB_NAME');
$username = getenv('DB_USER');
$password = getenv('DB_PASSWORD');
$port = (int) (getenv('DB_PORT') ?: 3306);

// Return API JSON for a missing or unreachable database instead of allowing
// mysqli's default exception output to leak an HTML fatal error to the client.
mysqli_report(MYSQLI_REPORT_OFF);
$conn = null;
$hostCandidates = [$host];
if (strcasecmp($host, 'localhost') === 0) {
    $hostCandidates[] = '127.0.0.1';
    $hostCandidates[] = '::1';
} elseif (strcasecmp($host, '127.0.0.1') === 0 || strcasecmp($host, '::1') === 0) {
    $hostCandidates[] = 'localhost';
}
$hostCandidates = array_values(array_unique(array_filter($hostCandidates, static fn ($value) => $value !== '')));

foreach ($hostCandidates as $candidateHost) {
    $candidate = @new mysqli($candidateHost, $username, $password, $dbname, $port);
    if (!$candidate->connect_error) {
        $conn = $candidate;
        break;
    }
    $lastConnectError = $candidate->connect_error;
    $candidate->close();
}

if (!$conn instanceof mysqli || $conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    error_log('Database connection failed: ' . ($lastConnectError ?? 'unknown mysqli error'));
    die(json_encode(['success' => false, 'message' => 'Database connection failed. Check the API database configuration and setup.']));
}

/** @var mysqli $conn */
$conn->set_charset("utf8mb4");
