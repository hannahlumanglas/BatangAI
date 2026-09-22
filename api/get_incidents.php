<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Handle browser preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
    ]);

    exit;
}

require_once "config.php";

/*
|--------------------------------------------------------------------------
| Resolve the requesting account and build its incident queue.
|--------------------------------------------------------------------------
|
| Visibility is enforced here, at the data source:
| - Administrators and Secretaries can review the full queue.
| - IT Personnel receive only incidents assigned to their user ID.
| - Employees receive only reports they submitted.
|
| The frontend session supplies the account ID, but the role is always read
| from the database rather than trusted from a browser value.
*/

$requesterId = trim((string)($_GET['userID'] ?? ''));

if ($requesterId === '') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'A logged-in user is required to retrieve incidents.'
    ]);
    $conn->close();
    exit;
}

$userStmt = $conn->prepare(
    'SELECT userID, role, status FROM users WHERE userID = ? LIMIT 1'
);

if (!$userStmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to verify the current user.']);
    $conn->close();
    exit;
}

$userStmt->bind_param('s', $requesterId);
$userStmt->execute();
$requester = $userStmt->get_result()->fetch_assoc();
$userStmt->close();

if (!$requester || strtolower(trim((string)$requester['status'])) !== 'active') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Your account is not allowed to retrieve incidents.']);
    $conn->close();
    exit;
}

$role = strtolower(trim((string)$requester['role']));
$baseSql = "
    SELECT
        incidents.incidentID,
        incidents.affectedIssue,
        incidents.classification,
        incidents.connectionType,
        incidents.createdAt,
        incidents.department,
        incidents.description,
        incidents.deviceType,
        incidents.employeeName,
        incidents.issueCategory,
        incidents.location,
        incidents.resolvedAt,
        incidents.resolvedBy,
        incidents.severity,
        incidents.status,
        incidents.summary,
        incidents.troubleshooting,
        incidents.userId,
        incidents.assigned,
        incidents.assignedAt,
        incidents.assignedTo,
        incidents.assignedToName,
        incidents.durationMinutes,
        incidents.resolutionNotes,
        incidents.startedAt,
        reporter.profilePhoto AS reporterProfilePhoto,
        assignee.profilePhoto AS assignedToProfilePhoto
    FROM incidents
    LEFT JOIN users AS reporter ON reporter.userID = incidents.userId
    LEFT JOIN users AS assignee ON assignee.userID = incidents.assignedTo
";

if ($role === 'it personnel') {
    $stmt = $conn->prepare($baseSql . ' WHERE incidents.assignedTo = ? ORDER BY incidents.createdAt DESC');
} elseif ($role === 'employee') {
    $stmt = $conn->prepare($baseSql . ' WHERE incidents.userId = ? ORDER BY incidents.createdAt DESC');
} elseif ($role === 'admin' || $role === 'administrator' || $role === 'secretary') {
    $stmt = $conn->prepare($baseSql . ' ORDER BY createdAt DESC');
} else {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Your account role is not allowed to retrieve incidents.']);
    $conn->close();
    exit;
}

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'count' => 0, 'incidents' => [], 'message' => 'Failed to retrieve incident reports.']);
    $conn->close();
    exit;
}

if ($role === 'it personnel' || $role === 'employee') {
    $stmt->bind_param('s', $requesterId);
}

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'count' => 0, 'incidents' => [], 'message' => 'Failed to retrieve incident reports.']);
    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "count" => 0,
        "incidents" => [],
        "message" => "Failed to retrieve incident reports.",
        "error" => $conn->error
    ]);

    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Build incident list
|--------------------------------------------------------------------------
*/

$incidents = [];

while ($row = $result->fetch_assoc()) {

    $row["incidentID"] = (string)($row["incidentID"] ?? "");
    $row["affectedIssue"] = (string)($row["affectedIssue"] ?? "");
    $row["classification"] = $row["classification"] !== null
        ? (string)$row["classification"]
        : null;

    $row["connectionType"] = $row["connectionType"] !== null
        ? (string)$row["connectionType"]
        : null;

    $row["createdAt"] = (string)($row["createdAt"] ?? "");
    $row["department"] = (string)($row["department"] ?? "");
    $row["description"] = (string)($row["description"] ?? "");
    $row["deviceType"] = $row["deviceType"] !== null
        ? (string)$row["deviceType"]
        : null;

    $row["employeeName"] = (string)($row["employeeName"] ?? "");
    $row["reporterProfilePhoto"] = $row["reporterProfilePhoto"] !== null
        ? (string)$row["reporterProfilePhoto"]
        : null;
    $row["issueCategory"] = (string)($row["issueCategory"] ?? "");
    $row["location"] = (string)($row["location"] ?? "");

    $row["resolvedAt"] = $row["resolvedAt"] !== null
        ? (string)$row["resolvedAt"]
        : null;

    $row["resolvedBy"] = $row["resolvedBy"] !== null
        ? (string)$row["resolvedBy"]
        : null;

    $row["severity"] = (string)($row["severity"] ?? "Low");
    $row["status"] = (string)($row["status"] ?? "Pending");

    $row["summary"] = $row["summary"] !== null
        ? (string)$row["summary"]
        : null;

    $row["troubleshooting"] = $row["troubleshooting"] !== null
        ? (string)$row["troubleshooting"]
        : null;

    $row["userId"] = (string)($row["userId"] ?? "");

    $row["assigned"] = (string)($row["assigned"] ?? "No");

    $row["assignedAt"] = $row["assignedAt"] !== null
        ? (string)$row["assignedAt"]
        : null;

    $row["assignedTo"] = $row["assignedTo"] !== null
        ? (string)$row["assignedTo"]
        : null;

    $row["assignedToName"] = $row["assignedToName"] !== null
        ? (string)$row["assignedToName"]
        : null;

    $row["assignedToProfilePhoto"] = $row["assignedToProfilePhoto"] !== null
        ? (string)$row["assignedToProfilePhoto"]
        : null;

    $row["durationMinutes"] = $row["durationMinutes"] !== null
        ? (int)$row["durationMinutes"]
        : null;

    $row["resolutionNotes"] = $row["resolutionNotes"] !== null
        ? (string)$row["resolutionNotes"]
        : null;

    $row["startedAt"] = $row["startedAt"] !== null
        ? (string)$row["startedAt"]
        : null;

    $incidents[] = $row;
}

/*
|--------------------------------------------------------------------------
| Successful response
|--------------------------------------------------------------------------
*/

echo json_encode([
    "success" => true,
    "count" => count($incidents),
    "incidents" => $incidents
]);

$result->free();
$stmt->close();
$conn->close();

?>
