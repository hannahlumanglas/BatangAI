<?php

require_once "cors.php";
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle browser preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);

    exit;
}

require_once "config.php";

// Get JSON data from React
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data."
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Get values from request
|--------------------------------------------------------------------------
*/

$userId = trim((string)($data["userId"] ?? ""));
$affectedIssue = trim((string)($data["affectedIssue"] ?? ""));
$description = trim((string)($data["description"] ?? ""));
$issueCategory = trim((string)($data["issueCategory"] ?? ""));
$deviceType = trim((string)($data["deviceType"] ?? ""));
$connectionType = trim((string)($data["connectionType"] ?? ""));
$location = trim((string)($data["location"] ?? ""));
$severity = isset($data["severity"]) && $data["severity"] !== ""
    ? trim((string)$data["severity"])
    : null;
$classification = trim((string)($data["classification"] ?? ""));
$keywords = $data["keywords"] ?? [];
if (!is_array($keywords)) {
    $keywords = [];
}
$keywords = array_values(array_filter($keywords, "is_string"));
$keywordsJson = json_encode($keywords, JSON_UNESCAPED_UNICODE);
if ($keywordsJson === false) {
    $keywordsJson = "[]";
}
$summary = trim((string)($data["summary"] ?? ""));
$troubleshooting = trim((string)($data["troubleshooting"] ?? ""));
if (!array_key_exists("resolvedByUser", $data) || !is_bool($data["resolvedByUser"])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please confirm whether the issue was resolved by the self-help steps."
    ]);
    exit;
}
$resolvedByUser = $data["resolvedByUser"];

/*
|--------------------------------------------------------------------------
| Validate required fields
|--------------------------------------------------------------------------
*/

if (
    $userId === "" ||
    $affectedIssue === "" ||
    $description === "" ||
    $issueCategory === "" ||
    $location === ""
) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Required incident information is missing."
    ]);

    exit;
}

// The authenticated employee identity is the database source of truth for
// reporter name and department. This prevents a browser payload from filing a
// report under another employee while retaining all report fields.
$employeeStmt = $conn->prepare('SELECT userID, fullName, department, role, status FROM users WHERE userID = ? LIMIT 1');
$employeeStmt->bind_param('s', $userId);
$employeeStmt->execute();
$employee = $employeeStmt->get_result()->fetch_assoc();
$employeeStmt->close();

if (!$employee || strtolower(trim((string)$employee['role'])) !== 'employee' || strtolower(trim((string)$employee['status'])) !== 'active') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only an active Employee account may submit an incident report.']);
    $conn->close();
    exit;
}

$employeeName = (string)$employee['fullName'];
$department = (string)$employee['department'];

/*
|--------------------------------------------------------------------------
| Validate severity
|--------------------------------------------------------------------------
*/

$allowedSeverity = [
    "High",
    "Medium",
    "Low"
];

if ($severity !== null && !in_array($severity, $allowedSeverity, true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Severity must be High, Medium, or Low."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Generate Incident ID
|--------------------------------------------------------------------------
|
| Example:
| INC-20260905-12345
|
*/

$incidentID = "INC-" . date("Ymd") . "-" . strtoupper(substr(uniqid(), -5));

/*
|--------------------------------------------------------------------------
| Default incident values
|--------------------------------------------------------------------------
*/

$status = $resolvedByUser ? "Resolved" : "Pending";
$assigned = "No";
$assignedAt = null;
$assignedTo = null;
$assignedToName = null;
$startedAt = null;
$resolvedAt = $resolvedByUser ? date('Y-m-d H:i:s') : null;
$resolvedBy = $resolvedByUser ? $employeeName : null;

/*
|--------------------------------------------------------------------------
| Insert incident into MySQL
|--------------------------------------------------------------------------
|
| Insert the incident and any user-confirmed resolution details.
|
*/

$sql = "
    INSERT INTO incidents (
        incidentID,
        affectedIssue,
        classification,
        keywords,
        connectionType,
        department,
        description,
        deviceType,
        employeeName,
        issueCategory,
        location,
        severity,
        status,
        summary,
        troubleshooting,
        userId,
        assigned,
        assignedAt,
        assignedTo,
        assignedToName,
        startedAt,
        resolvedAt,
        resolvedBy
    )
    VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
    )
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare database query.",
        "error" => $conn->error
    ]);

    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Bind parameters
|--------------------------------------------------------------------------
|
| 23 placeholders = 23 variables
|
*/

$stmt->bind_param(
    "sssssssssssssssssssssss",
    $incidentID,
    $affectedIssue,
    $classification,
    $keywordsJson,
    $connectionType,
    $department,
    $description,
    $deviceType,
    $employeeName,
    $issueCategory,
    $location,
    $severity,
    $status,
    $summary,
    $troubleshooting,
    $userId,
    $assigned,
    $assignedAt,
    $assignedTo,
    $assignedToName,
    $startedAt,
    $resolvedAt,
    $resolvedBy
);

/*
|--------------------------------------------------------------------------
| Execute query
|--------------------------------------------------------------------------
*/

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to create incident.",
        "error" => $stmt->error
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Successful response
|--------------------------------------------------------------------------
*/

echo json_encode([
    "success" => true,
    "message" => "Incident created successfully.",
    "incidentID" => $incidentID,
    "status" => $status,
    "assigned" => $assigned,
    "resolvedBy" => $resolvedBy
]);

$stmt->close();
$conn->close();

?>
