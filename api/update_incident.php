<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "config.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data."
    ]);

    exit;
}

$incidentID = trim($data['incidentID'] ?? '');
$severity = trim($data['severity'] ?? '');

$allowedSeverity = ['High', 'Medium', 'Low'];

if ($incidentID === '' || !in_array($severity, $allowedSeverity, true)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Valid incident ID and severity are required."
    ]);

    exit;
}

$sql = "
    UPDATE incidents
    SET severity = ?
    WHERE incidentID = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare update query."
    ]);

    exit;
}

$stmt->bind_param(
    "ss",
    $severity,
    $incidentID
);

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to update severity.",
        "error" => $stmt->error
    ]);

    $stmt->close();
    $conn->close();

    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Severity updated successfully."
]);

$stmt->close();
$conn->close();

?>