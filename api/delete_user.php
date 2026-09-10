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

$adminUserID = $data["adminUserID"] ?? "";
$userID = $data["userID"] ?? "";

if ($adminUserID === "" || $userID === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Administrator user ID and target user ID are required."
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| Verify Administrator
|--------------------------------------------------------------------------
*/

$adminStmt = $conn->prepare("
    SELECT userID, role, status
    FROM users
    WHERE userID = ?
    LIMIT 1
");

$adminStmt->bind_param("i", $adminUserID);
$adminStmt->execute();

$adminResult = $adminStmt->get_result();

if ($adminResult->num_rows === 0) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Administrator account not found."
    ]);
    $adminStmt->close();
    $conn->close();
    exit;
}

$admin = $adminResult->fetch_assoc();

$adminRole = strtolower(trim($admin["role"]));
$adminStatus = strtolower(trim($admin["status"]));

if (
    ($adminRole !== "admin" && $adminRole !== "administrator") ||
    $adminStatus !== "active"
) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Only an active Administrator can delete user accounts."
    ]);
    $adminStmt->close();
    $conn->close();
    exit;
}

$adminStmt->close();

/*
|--------------------------------------------------------------------------
| Prevent Administrator From Deleting Their Own Account
|--------------------------------------------------------------------------
*/

if ((string)$adminUserID === (string)$userID) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "You cannot delete your own Administrator account."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Find Target User
|--------------------------------------------------------------------------
*/

$userStmt = $conn->prepare("
    SELECT
        userID,
        fullName,
        email,
        employeeId,
        department,
        role,
        status
    FROM users
    WHERE userID = ?
    LIMIT 1
");

$userStmt->bind_param("i", $userID);
$userStmt->execute();

$userResult = $userStmt->get_result();

if ($userResult->num_rows === 0) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "User account not found."
    ]);
    $userStmt->close();
    $conn->close();
    exit;
}

$user = $userResult->fetch_assoc();

$userRole = strtolower(trim($user["role"]));

/*
|--------------------------------------------------------------------------
| Protect Administrator Accounts
|--------------------------------------------------------------------------
*/

if ($userRole === "admin" || $userRole === "administrator") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Administrator accounts cannot be deleted."
    ]);
    $userStmt->close();
    $conn->close();
    exit;
}

$userStmt->close();

/*
|--------------------------------------------------------------------------
| Delete User
|--------------------------------------------------------------------------
*/

$deleteStmt = $conn->prepare("
    DELETE FROM users
    WHERE userID = ?
");

$deleteStmt->bind_param("i", $userID);

if (!$deleteStmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete the user account."
    ]);
    $deleteStmt->close();
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Confirm Deletion
|--------------------------------------------------------------------------
*/

if ($deleteStmt->affected_rows === 0) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "User account could not be deleted because it no longer exists."
    ]);
    $deleteStmt->close();
    $conn->close();
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "User account deleted successfully.",
    "user" => [
        "userID" => $user["userID"],
        "fullName" => $user["fullName"],
        "email" => $user["email"],
        "employeeId" => $user["employeeId"],
        "department" => $user["department"],
        "role" => $user["role"],
        "status" => $user["status"]
    ]
]);

$deleteStmt->close();
$conn->close();

?>