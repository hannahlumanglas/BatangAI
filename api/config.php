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

$conn = new mysqli($host, $username, $password, $dbname, $port);

if ($conn->connect_error) {
    http_response_code(500);
    die("Database connection failed.");
}

$conn->set_charset("utf8mb4");
