<?php

require_once "cors.php";
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

/** @var mysqli $conn */
require_once "config.php";
require_once "auth_tokens.php";
require_once "security_policy.php";

if (!($admin = require_role_session($conn, ["Administrator"], "Only an Administrator can manage account passwords."))) {
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$userID = trim((string)($data["userID"] ?? ""));
$newPassword = (string)($data["newPassword"] ?? "");

if ($userID === "" || $newPassword === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "User ID and new password are required."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Validate New Password
|--------------------------------------------------------------------------
*/

if (($passwordError = password_policy_error($newPassword)) !== null) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $passwordError]);
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
