<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
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
        dateCreated,
        department,
        email,
        employeeId,
        fullName,
        password,
        profilePhoto,
        role,
        status
    FROM users
    ORDER BY userID ASC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve users.",
        "error" => $conn->error
    ]);

    $conn->close();
    exit;
}

$users = [];

while ($row = $result->fetch_assoc()) {
    $users[] = [
        "userID" => $row["userID"],
        "dateCreated" => $row["dateCreated"],
        "department" => $row["department"],
        "email" => $row["email"],
        "employeeId" => $row["employeeId"],
        "fullName" => $row["fullName"],
        "profilePhoto" => $row["profilePhoto"],
        "role" => $row["role"],
        "status" => $row["status"]
    ];
}

echo json_encode([
    "success" => true,
    "users" => $users
]);

$conn->close();
?>