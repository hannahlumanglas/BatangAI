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
$status = trim((string)($data["status"] ?? ""));

if ($adminUserID === "" || $userID === "" || $status === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Administrator ID, user ID, and status are required."
    ]);
    exit;
}

$status = ucfirst(strtolower($status));

if (!in_array($status, ["Active", "Inactive"], true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid account status."
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| Verify Administrator
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
        "message" => "Only an active Administrator can update account status."
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
| Protect Administrator Account
|--------------------------------------------------------------------------
*/

$targetRole = strtolower(trim($targetUser["role"] ?? ""));

if ($targetRole === "admin" || $targetRole === "administrator") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "The Administrator account cannot be disabled through User Management."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Update Account Status
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare("
    UPDATE users
    SET status = ?
    WHERE userID = ?
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare status update."
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("si", $status, $userID);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update account status."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "message" => "Account status updated successfully.",
    "user" => [
        "userID" => $targetUser["userID"],
        "fullName" => $targetUser["fullName"],
        "status" => $status
    ]
]);

?>