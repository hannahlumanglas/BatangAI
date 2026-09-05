<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "config.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

$sql = "
    SELECT
        userID,
        employeeId,
        fullName,
        email,
        department,
        role,
        status
    FROM users
    WHERE role = 'IT Personnel'
    ORDER BY fullName ASC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve IT Personnel.",
        "error" => $conn->error
    ]);

    exit;
}

$personnel = [];

while ($row = $result->fetch_assoc()) {
    $personnel[] = $row;
}

echo json_encode([
    "success" => true,
    "personnel" => $personnel
]);

$conn->close();
?>