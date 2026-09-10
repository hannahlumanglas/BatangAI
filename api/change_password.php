<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

require_once "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$adminUserID = trim((string)($data["adminUserID"] ?? ""));
$userID = trim((string)($data["userID"] ?? ""));
$newPassword = $data["newPassword"] ?? "";

if ($adminUserID === "" || $userID === "" || $newPassword === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Administrator ID, user ID, and new password are required."
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| Verify the Administrator
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare("
    SELECT userID, role, status
    FROM users
    WHERE userID = ?
    LIMIT 1
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare administrator verification."
    ]);
    exit;
}

$stmt->bind_param("i", $adminUserID);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Administrator account was not found."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$admin = $result->fetch_assoc();
$stmt->close();

$adminRole = strtolower(trim($admin["role"] ?? ""));
$adminStatus = strtolower(trim($admin["status"] ?? ""));

if (
    ($adminRole !== "admin" && $adminRole !== "administrator") ||
    $adminStatus !== "active"
) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Only an active Administrator can change user passwords."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Validate New Password
|--------------------------------------------------------------------------
*/

if (strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters long."
    ]);
    $conn->close();
    exit;
}

if (!preg_match('/[A-Z]/', $newPassword)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must contain at least one uppercase letter."
    ]);
    $conn->close();
    exit;
}

if (!preg_match('/[a-z]/', $newPassword)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must contain at least one lowercase letter."
    ]);
    $conn->close();
    exit;
}

if (!preg_match('/[0-9]/', $newPassword)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must contain at least one number."
    ]);
    $conn->close();
    exit;
}

if (!preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must contain at least one special character."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Verify Target User
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare("
    SELECT userID, fullName, role, status
    FROM users
    WHERE userID = ?
    LIMIT 1
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare user verification."
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("i", $userID);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "User account was not found."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$targetUser = $result->fetch_assoc();
$stmt->close();

/*
|--------------------------------------------------------------------------
| Prevent Administrator Password Changes Through User Management
|--------------------------------------------------------------------------
|
| The default Administrator account remains protected.
|
*/

$targetRole = strtolower(trim($targetUser["role"] ?? ""));

if ($targetRole === "admin" || $targetRole === "administrator") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "The Administrator account cannot be changed through User Management."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Hash New Password
|--------------------------------------------------------------------------
*/

$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

if ($hashedPassword === false) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to secure the new password."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Update Password
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare("
    UPDATE users
    SET password = ?
    WHERE userID = ?
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare password update."
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("si", $hashedPassword, $userID);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update the password."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "message" => "Password updated successfully.",
    "user" => [
        "userID" => $targetUser["userID"],
        "fullName" => $targetUser["fullName"]
    ]
]);

?>