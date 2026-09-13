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
 * Every column this endpoint is allowed to touch, and how to bind it.
 * Only keys actually present in the request body get updated — this is
 * what keeps the old "Admin sets severity only" call working exactly as
 * before, while also supporting Edit Incident's full-record update (all
 * of these fields plus a freshly regenerated AI analysis) in one request.
 */
$updatableFields = [
    'department'      => 's',
    'location'        => 's',
    'issueCategory'   => 's',
    'deviceType'      => 's',
    'connectionType'  => 's',
    'affectedIssue'   => 's',
    'description'     => 's',
    'severity'        => 's',
    'classification'  => 's',
    'summary'         => 's',
    'troubleshooting' => 's',
];

$allowedSeverity = ['High', 'Medium', 'Low'];

$setParts = [];
$bindTypes = '';
$bindValues = [];

foreach ($updatableFields as $field => $bindType) {
    if (!array_key_exists($field, $data)) {
        continue;
    }

    $value = trim((string) $data[$field]);

    if ($field === 'severity' && !in_array($value, $allowedSeverity, true)) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Severity must be High, Medium, or Low."
        ]);

        exit;
    }

    $setParts[] = "`$field` = ?";
    $bindTypes .= $bindType;
    $bindValues[] = $value;
}

if (empty($setParts)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "No valid fields were provided to update."
    ]);

    exit;
}

$sql = "
    UPDATE incidents
    SET " . implode(", ", $setParts) . "
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

$bindTypes .= 's';
$bindValues[] = $incidentID;

$stmt->bind_param($bindTypes, ...$bindValues);

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to update the incident.",
        "error" => $stmt->error
    ]);

    $stmt->close();
    $conn->close();

    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Incident updated successfully."
]);

$stmt->close();
$conn->close();

?>