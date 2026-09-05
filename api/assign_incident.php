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
$assignedTo = trim((string)($data['assignedTo'] ?? ''));
$assignedToName = trim($data['assignedToName'] ?? '');

if ($incidentID === '' || $assignedTo === '' || $assignedToName === '') {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Incident ID, assigned personnel, and personnel name are required."
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| ASSIGN INCIDENT
|--------------------------------------------------------------------------
| Admin assigns the incident to IT Personnel.
|
| The incident remains:
|   assigned   = Yes
|   status     = Pending
|   startedAt  = NULL
|
| IT Personnel will change the status to "In Progress"
| by clicking "Take Action".
|--------------------------------------------------------------------------
*/

$sql = "
    UPDATE incidents
    SET
        assigned = 'Yes',
        assignedAt = NOW(),
        assignedTo = ?,
        assignedToName = ?,
        status = 'Pending',
        startedAt = NULL
    WHERE incidentID = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare assignment query."
    ]);

    exit;
}

$stmt->bind_param(
    "sss",
    $assignedTo,
    $assignedToName,
    $incidentID
);

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to assign incident.",
        "error" => $stmt->error
    ]);

    $stmt->close();
    $conn->close();

    exit;
}

if ($stmt->affected_rows === 0) {
    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Incident not found."
    ]);

    $stmt->close();
    $conn->close();

    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Incident assigned successfully.",
    "incidentID" => $incidentID,
    "assignedTo" => $assignedTo,
    "assignedToName" => $assignedToName,
    "status" => "Pending"
]);

$stmt->close();
$conn->close();

?>