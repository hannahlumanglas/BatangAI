<?php

require_once "cors.php";
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";
require_once "auth_tokens.php";

if (!require_admin_session($conn)) {
    $conn->close();
    exit;
}

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
    $role = strtolower(trim((string)$row["role"])) === "it support"
        ? "IT Personnel"
        : $row["role"];
    $profilePhoto = $row["profilePhoto"];
    if (is_string($profilePhoto) && str_contains($profilePhoto, "/")) {
        $profilePhoto = basename($profilePhoto);
    }
    $users[] = [
        "userID" => $row["userID"],
        "dateCreated" => $row["dateCreated"],
        "department" => $row["department"],
        "email" => $row["email"],
        "employeeId" => $row["employeeId"],
        "fullName" => $row["fullName"],
        "profilePhoto" => $profilePhoto,
        "role" => $role,
        "status" => $row["status"]
    ];
}

echo json_encode([
    "success" => true,
    "users" => $users
]);

$conn->close();
?>
