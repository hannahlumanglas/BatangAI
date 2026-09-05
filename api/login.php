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

$email = trim($data["email"] ?? "");
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
    WHERE email = ?
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

if (strtolower($user["status"]) !== "active") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "This account is inactive."
    ]);

    exit;
}

// Convert database role "Admin" to frontend role "Administrator"
if (strtolower($user["role"]) === "admin") {
    $user["role"] = "Administrator";
}

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