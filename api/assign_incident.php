<?php

require_once "cors.php";
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "config.php";
require_once "auth_tokens.php";

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
$rawSubs = is_array($data['subUserIDs'] ?? null) ? $data['subUserIDs'] : [];
$subUserIDs = array_values(array_unique(array_filter(array_map('strval', $rawSubs), fn($id) => $id !== '' && $id !== $assignedTo)));
$sessionUser = require_role_session($conn, ['Administrator', 'Secretary'], 'Only an Administrator or Secretary may assign incidents.');
if ($sessionUser === null) { $conn->close(); exit; }

if ($incidentID === '' || $assignedTo === '') {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Incident ID, assigned personnel, and the current user are required."
    ]);

    exit;
}

$personnelStmt = $conn->prepare("SELECT userID, fullName FROM users WHERE userID = ? AND role IN ('IT Personnel', 'IT Support') AND LOWER(status) = 'active' LIMIT 1");
$personnelStmt->bind_param('s', $assignedTo);
$personnelStmt->execute();
$personnel = $personnelStmt->get_result()->fetch_assoc();
$personnelStmt->close();

if (!$personnel) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'The selected account is not an active Technician.']);
    $conn->close();
    exit;
}

$assignedTo = (string)$personnel['userID'];
$assignedToName = (string)$personnel['fullName'];

foreach ($subUserIDs as $subID) {
    if (!ctype_digit($subID)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Invalid SUB technician selected.']); $conn->close(); exit; }
}
if ($subUserIDs) {
    $placeholders = implode(',', array_fill(0, count($subUserIDs), '?'));
    $check = $conn->prepare("SELECT userID FROM users WHERE userID IN ($placeholders) AND role IN ('IT Personnel', 'IT Support') AND LOWER(status) = 'active'");
    $check->bind_param(str_repeat('s', count($subUserIDs)), ...$subUserIDs); $check->execute();
    $validSubs = $check->get_result()->num_rows; $check->close();
    if ($validSubs !== count($subUserIDs)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Every SUB must be an active Technician.']); $conn->close(); exit; }
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
        assigned = 1,
        assignedAt = NOW(),
        assignedTo = ?,
        assignedToName = ?,
        status = 'Pending',
        startedAt = NULL
    WHERE incidentID = ?
      AND status NOT IN ('Resolved', 'Closed')
      AND severity IS NOT NULL AND TRIM(severity) <> ''
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
    $statusStmt = $conn->prepare('SELECT status, severity FROM incidents WHERE incidentID = ? LIMIT 1');
    $statusStmt->bind_param('s', $incidentID);
    $statusStmt->execute();
    $existingIncident = $statusStmt->get_result()->fetch_assoc();
    $statusStmt->close();

    if ($existingIncident && empty($existingIncident['severity'])) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Set a severity level before assigning a Technician."
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }

    $isAlreadyResolved = $existingIncident && in_array(
        (string)$existingIncident['status'],
        ['Resolved', 'Closed'],
        true
    );

    if (!$existingIncident || $isAlreadyResolved) {
        http_response_code($isAlreadyResolved ? 409 : 404);

        echo json_encode([
            "success" => false,
            "message" => $isAlreadyResolved
                ? "Resolved incidents cannot be assigned."
                : "Incident not found."
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }
}

$conn->begin_transaction();
try {
    $deleteSubs = $conn->prepare('DELETE FROM incident_sub_assignments WHERE incidentID = ?');
    $deleteSubs->bind_param('s', $incidentID); $deleteSubs->execute(); $deleteSubs->close();
    if ($subUserIDs) {
        $insertSub = $conn->prepare('INSERT INTO incident_sub_assignments (incidentID, userID) VALUES (?, ?)');
        foreach ($subUserIDs as $subID) { $insertSub->bind_param('ss', $incidentID, $subID); $insertSub->execute(); }
        $insertSub->close();
    }
    $conn->commit();
} catch (Throwable $e) {
    $conn->rollback(); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Incident assignment was saved, but SUB assignments could not be saved.']);
    $stmt->close(); $conn->close(); exit;
}

echo json_encode([
    "success" => true,
    "message" => "Incident assigned successfully.",
    "incidentID" => $incidentID,
    "assignedTo" => $assignedTo,
    "assignedToName" => $assignedToName,
    "subUserIDs" => $subUserIDs,
    "status" => "Pending"
]);

$stmt->close();
$conn->close();

?>
