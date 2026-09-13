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

if ($incidentID === '') {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Valid incident ID is required."
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Confirm the incident exists (and its current status)
|--------------------------------------------------------------------------
|
| The employee UI already only lets you delete a Pending incident of your
| own, but the backend re-checks status here too, so this rule holds even
| if it's ever called from somewhere else.
|--------------------------------------------------------------------------
*/

$checkStmt = $conn->prepare("
    SELECT incidentID, status
    FROM incidents
    WHERE incidentID = ?
    LIMIT 1
");

if (!$checkStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare incident lookup."
    ]);

    exit;
}

$checkStmt->bind_param("s", $incidentID);
$checkStmt->execute();

$result = $checkStmt->get_result();
$incident = $result->fetch_assoc();

$checkStmt->close();

if (!$incident) {
    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Incident not found."
    ]);

    exit;
}

if ($incident['status'] !== 'Pending') {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Only Pending incidents can be deleted."
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Delete the incident
|--------------------------------------------------------------------------
*/

$deleteStmt = $conn->prepare("
    DELETE FROM incidents
    WHERE incidentID = ?
");

if (!$deleteStmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare delete query."
    ]);

    exit;
}

$deleteStmt->bind_param("s", $incidentID);

if (!$deleteStmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to delete the incident.",
        "error" => $deleteStmt->error
    ]);

    $deleteStmt->close();
    $conn->close();

    exit;
}

if ($deleteStmt->affected_rows === 0) {
    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Incident could not be deleted because it no longer exists."
    ]);

    $deleteStmt->close();
    $conn->close();

    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Incident deleted successfully.",
    "incidentID" => $incidentID
]);

$deleteStmt->close();
$conn->close();

?>