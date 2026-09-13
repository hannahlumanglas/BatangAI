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

$data = json_decode(file_get_contents("php://input"), true);

$email = strtolower(trim((string)($data["email"] ?? "")));
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Email and password are required."
    ]);

    exit;
}

$stmt = $conn->prepare("
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
    /*
     * Do not rely on a particular database collation for authentication.
     * Registration stores normalized addresses, but this also supports
     * accounts that existed before that rule was added.
     */
    WHERE LOWER(email) = ?
    LIMIT 1
");

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);

    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user["password"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);

    exit;
}

if (strtolower(trim((string)$user["status"])) !== "active") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "This account is inactive."
    ]);

    exit;
}

/*
 * The frontend authorizes only these canonical role labels. Normalize the
 * legacy database value "Admin" and reject an invalid role rather than
 * accidentally treating it as an Employee.
 */
$roleMap = [
    "admin" => "Administrator",
    "administrator" => "Administrator",
    "secretary" => "Secretary",
    "it personnel" => "IT Personnel",
    "employee" => "Employee"
];
$normalizedRole = strtolower(trim((string)$user["role"]));

if (!isset($roleMap[$normalizedRole])) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "This account has an invalid role configuration."
    ]);
    exit;
}

$user["role"] = $roleMap[$normalizedRole];

// Never send the password to the frontend
unset($user["password"]);

echo json_encode([
    "success" => true,
    "message" => "Login successful.",
    "user" => $user
]);

$stmt->close();
$conn->close();

?>
