<?php

require_once "cors.php";
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "config.php";
require_once "auth_tokens.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

$sessionUser = require_role_session($conn, ['Administrator', 'Secretary', 'IT Personnel'], 'Only signed-in Administrators, Secretaries, or Technicians may view Technician options.');
if ($sessionUser === null) { $conn->close(); exit; }

$sql = "
    SELECT
        userID,
        fullName,
        department,
        role,
        status,
        profilePhoto
    FROM users
    WHERE role IN ('Technician', 'IT Personnel', 'IT Support') AND LOWER(status) = 'active'
    ORDER BY fullName ASC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve Technicians.",
        "error" => $conn->error
    ]);

    exit;
}

$personnel = [];

while ($row = $result->fetch_assoc()) {
    if (is_string($row['profilePhoto']) && str_contains($row['profilePhoto'], '/')) $row['profilePhoto'] = basename($row['profilePhoto']);
    $personnel[] = $row;
}

echo json_encode([
    "success" => true,
    "personnel" => $personnel
]);

$conn->close();
?>
