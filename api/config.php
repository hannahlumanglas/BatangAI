<?php

$host = getenv("DB_HOST") ?: "localhost";
$dbname = getenv("DB_NAME") ?: "ai_nirts";
$username = getenv("DB_USER") ?: "root";
$password = getenv("DB_PASSWORD") ?: "";
$port = (int) (getenv("DB_PORT") ?: 3306);

$conn = new mysqli($host, $username, $password, $dbname, $port);

if ($conn->connect_error) {
    http_response_code(500);
    die("Database connection failed.");
}

$conn->set_charset("utf8mb4");
