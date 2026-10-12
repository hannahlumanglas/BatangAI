<?php

require_once "cors.php";
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";
require_once "catalog.php";
require_once "auth_tokens.php";
require_once "security_policy.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

if (!require_admin_session($conn)) {
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$fullName = trim($data["fullName"] ?? "");
$employeeId = "";
$department = trim($data["department"] ?? "");
$email = strtolower(trim((string)($data["email"] ?? "")));
$password = $data["password"] ?? "";
$role = trim($data["role"] ?? "");

/*
 * ---------------------------------------------------------
 * 2. Validate required fields
 * ---------------------------------------------------------
 */

if (
    $fullName === "" ||
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
 * Active Administrators may create accounts for every supported role.
 */

if (!is_active_catalog_value($conn, 'user_role', $role)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid account role."
    ]);
    $conn->close();
    exit;
}

$officeCheck = $conn->prepare('SELECT officeID FROM offices WHERE officeName = ? AND active = 1 LIMIT 1');
if (!$officeCheck) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to validate the selected Office."]);
    $conn->close();
    exit;
}
$officeCheck->bind_param('s', $department);
$officeCheck->execute();
$officeCheck->store_result();
$validOffice = $officeCheck->num_rows === 1;
$officeCheck->close();
if (!$validOffice) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please select an active Office from the list."]);
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

$passwordError = password_policy_error((string)$password);
if ($passwordError !== null) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $passwordError
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
    WHERE LOWER(email) = ?
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
$databaseRole = $role === "IT Personnel" ? "IT Support" : $role;
$pendingEmployeeId = "__PENDING__" . bin2hex(random_bytes(16));
$conn->begin_transaction();

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
    $pendingEmployeeId,
    $fullName,
    $hashedPassword,
    $databaseRole,
    $status
);

if (!$stmt->execute()) {
    $conn->rollback();
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
$employeeIdBase = "EMP-" . str_pad((string)$newUserId, 4, "0", STR_PAD_LEFT);
$employeeId = $employeeIdBase;
$suffix = 1;
do {
    $checkEmployeeId = $conn->prepare("SELECT userID FROM users WHERE LOWER(TRIM(employeeId)) = LOWER(?) LIMIT 1");
    $checkEmployeeId->bind_param("s", $employeeId);
    $checkEmployeeId->execute();
    $idExists = $checkEmployeeId->get_result()->num_rows > 0;
    $checkEmployeeId->close();
    if ($idExists) $employeeId = $employeeIdBase . "-" . $suffix++;
} while ($idExists);
$saveEmployeeId = $conn->prepare("UPDATE users SET employeeId = ? WHERE userID = ?");
$saveEmployeeId->bind_param("si", $employeeId, $newUserId);
if (!$saveEmployeeId->execute()) {
    $saveEmployeeId->close();
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to save the generated Employee ID."]);
    $stmt->close();
    $conn->close();
    exit;
}
$saveEmployeeId->close();
$conn->commit();
$createdAt = null;
$dateStmt = $conn->prepare("SELECT dateCreated FROM users WHERE userID = ? LIMIT 1");
if ($dateStmt) {
    $dateStmt->bind_param("i", $newUserId);
    if ($dateStmt->execute()) {
        $dateResult = $dateStmt->get_result();
        if ($dateRow = $dateResult->fetch_assoc()) {
            $createdAt = $dateRow["dateCreated"];
        }
    }
    $dateStmt->close();
}

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
        "status" => $status,
        "dateCreated" => $createdAt
    ]
]);

$stmt->close();
$conn->close();
?>
