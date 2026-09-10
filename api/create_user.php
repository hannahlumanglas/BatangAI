<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$adminUserID = $data["adminUserID"] ?? "";
$fullName = trim($data["fullName"] ?? "");
$employeeId = trim($data["employeeId"] ?? "");
$department = trim($data["department"] ?? "");
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";
$role = trim($data["role"] ?? "");

/*
 * ---------------------------------------------------------
 * 1. Validate Administrator
 * ---------------------------------------------------------
 */

if ($adminUserID === "") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Administrator verification is required."
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT userID, role, status
    FROM users
    WHERE userID = ?
    LIMIT 1
");

$stmt->bind_param("i", $adminUserID);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Administrator account not found."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$admin = $result->fetch_assoc();
$stmt->close();

$isAdmin =
    strtolower($admin["role"]) === "admin" ||
    strtolower($admin["role"]) === "administrator";

$isActive = strtolower($admin["status"]) === "active";

if (!$isAdmin || !$isActive) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Only an active Administrator can create accounts."
    ]);
    $conn->close();
    exit;
}

/*
 * ---------------------------------------------------------
 * 2. Validate required fields
 * ---------------------------------------------------------
 */

if (
    $fullName === "" ||
    $employeeId === "" ||
    $department === "" ||
    $email === "" ||
    $password === "" ||
    $role === ""
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please complete all required fields."
    ]);
    $conn->close();
    exit;
}

/*
 * ---------------------------------------------------------
 * 3. Validate allowed roles
 * ---------------------------------------------------------
 *
 * Administrator cannot create another Administrator account
 * through this form.
 */

$allowedRoles = [
    "Employee",
    "IT Personnel",
    "Secretary"
];

if (!in_array($role, $allowedRoles, true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid account role."
    ]);
    $conn->close();
    exit;
}

/*
 * ---------------------------------------------------------
 * 4. Validate email
 * ---------------------------------------------------------
 */

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
    $conn->close();
    exit;
}

/*
 * ---------------------------------------------------------
 * 5. Validate password
 * ---------------------------------------------------------
 *
 * At least:
 * - 8 characters
 * - 1 uppercase
 * - 1 lowercase
 * - 1 number
 * - 1 special character
 */

if (
    strlen($password) < 8 ||
    !preg_match('/[A-Z]/', $password) ||
    !preg_match('/[a-z]/', $password) ||
    !preg_match('/[0-9]/', $password) ||
    !preg_match('/[^A-Za-z0-9]/', $password)
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    ]);
    $conn->close();
    exit;
}

/*
 * ---------------------------------------------------------
 * 6. Check duplicate email
 * ---------------------------------------------------------
 */

$stmt = $conn->prepare("
    SELECT userID
    FROM users
    WHERE email = ?
    LIMIT 1
");

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "message" => "An account with this email already exists."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();

/*
 * ---------------------------------------------------------
 * 7. Check duplicate Employee ID
 * ---------------------------------------------------------
 */

$stmt = $conn->prepare("
    SELECT userID
    FROM users
    WHERE employeeId = ?
    LIMIT 1
");

$stmt->bind_param("s", $employeeId);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "message" => "This Employee ID is already registered."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();

/*
 * ---------------------------------------------------------
 * 8. Hash password
 * ---------------------------------------------------------
 */

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

/*
 * ---------------------------------------------------------
 * 9. Create account
 * ---------------------------------------------------------
 */

$status = "Active";

$stmt = $conn->prepare("
    INSERT INTO users (
        dateCreated,
        department,
        email,
        employeeId,
        fullName,
        password,
        role,
        status
    )
    VALUES (
        NOW(),
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
    )
");

$stmt->bind_param(
    "sssssss",
    $department,
    $email,
    $employeeId,
    $fullName,
    $hashedPassword,
    $role,
    $status
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to create the account."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$newUserId = $conn->insert_id;

/*
 * ---------------------------------------------------------
 * 10. Return created user
 * ---------------------------------------------------------
 */

echo json_encode([
    "success" => true,
    "message" => "User account created successfully.",
    "user" => [
        "userID" => $newUserId,
        "fullName" => $fullName,
        "employeeId" => $employeeId,
        "department" => $department,
        "email" => $email,
        "role" => $role,
        "status" => $status
    ]
]);

$stmt->close();
$conn->close();

?>