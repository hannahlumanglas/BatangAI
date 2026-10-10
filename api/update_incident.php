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

if (array_key_exists('severity', $data)) {
    $actorUserId = trim((string)($data['actorUserId'] ?? ''));
    if (!ctype_digit($actorUserId)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only an Administrator or Secretary may set incident severity.']);
        $conn->close();
        exit;
    }

    $actorStmt = $conn->prepare('SELECT role, status FROM users WHERE userID = ? LIMIT 1');
    $actorStmt->bind_param('s', $actorUserId);
    $actorStmt->execute();
    $actor = $actorStmt->get_result()->fetch_assoc();
    $actorStmt->close();
    $actorRole = strtolower(trim((string)($actor['role'] ?? '')));
    if (!$actor || strtolower(trim((string)$actor['status'])) !== 'active'
        || !in_array($actorRole, ['admin', 'administrator', 'secretary'], true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only an active Administrator or Secretary may set incident severity.']);
        $conn->close();
        exit;
    }
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
];

$allowedSeverity = ['High', 'Medium', 'Low', 'Critical'];

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
            "message" => "Severity must be High, Medium, Low, or Critical."
        ]);

        exit;
    }

    $setParts[] = "`$field` = ?";
    $bindTypes .= $bindType;
    $bindValues[] = $value;
}

if (array_key_exists('troubleshooting', $data)) {
    $troubleshooting = trim((string)$data['troubleshooting']);
    $parts = preg_split('/^\s*IT Troubleshooting Suggestions:\s*$/im', $troubleshooting, 2);
    $setParts[] = 'basicTroubleshootingChecklist = ?';
    $bindTypes .= 's';
    $bindValues[] = trim((string)($parts[0] ?? ''));
    $setParts[] = 'technicalTroubleshootingSuggestions = ?';
    $bindTypes .= 's';
    $bindValues[] = trim((string)($parts[1] ?? ''));
}

if (array_key_exists('keywords', $data)) {
    $keywords = is_array($data['keywords'])
        ? array_values(array_filter($data['keywords'], 'is_string'))
        : [];
    $keywordsJson = json_encode($keywords, JSON_UNESCAPED_UNICODE);
    $setParts[] = 'keywords = ?';
    $bindTypes .= 's';
    $bindValues[] = $keywordsJson === false ? '[]' : $keywordsJson;
}

if (empty($setParts)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "No valid fields were provided to update."
    ]);

    exit;
}

/*
 * Lock the incident row while checking its status and applying the edit.
 * This prevents a request racing with a resolution from changing a ticket
 * after it becomes Resolved or Closed.
 */
$conn->begin_transaction();
$statusStmt = $conn->prepare(
    "SELECT status FROM incidents WHERE incidentID = ? FOR UPDATE"
);

if (!$statusStmt) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to verify incident status."
    ]);
    exit;
}

$statusStmt->bind_param("s", $incidentID);
$statusStmt->execute();
$statusResult = $statusStmt->get_result();
$currentIncident = $statusResult->fetch_assoc();
$statusStmt->close();

if (!$currentIncident) {
    $conn->rollback();
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Incident not found."
    ]);
    exit;
}

$currentStatus = strtolower(trim((string) $currentIncident['status']));
if ($currentStatus === 'resolved' || $currentStatus === 'closed') {
    $conn->rollback();
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Resolved incidents cannot be edited."
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
    $conn->rollback();
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
    $conn->rollback();
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

$conn->commit();

echo json_encode([
    "success" => true,
    "message" => "Incident updated successfully."
]);

$stmt->close();
$conn->close();

?>
