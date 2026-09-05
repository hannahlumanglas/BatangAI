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

$fullName = trim($data["fullName"] ?? "");
$employeeId = trim($data["employeeId"] ?? "");
$department = trim($data["department"] ?? "");
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

/*
 * Role is determined by the department.
 *
 * Information Technology Services Division
 * = IT Personnel
 *
 * All other departments/offices
 * = Employee
 */
if ($department === "Information Technology Services Division") {
    $role = "IT Personnel";
} else {
    $role = "Employee";
}

/*
 * Validate required fields.
 */
if (
    $fullName === "" ||
    $employeeId === "" ||
    $department === "" ||
    $email === "" ||
    $password === ""
) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Please complete all required fields."
    ]);

    exit;
}

/*
 * Validate email.
 */
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);

    exit;
}

/*
 * Strong password requirement:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
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

    exit;
}

/*
 * Check if email already exists.
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
 * Check if Employee ID already exists.
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
 * Hash the password before saving it.
 */
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

/*
 * New registered accounts are active by default.
 */
$status = "Active";

/*
 * Save the new account.
 */
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

echo json_encode([
    "success" => true,
    "message" => "Registration successful.",
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