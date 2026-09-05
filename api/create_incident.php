<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
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
$employeeName = trim((string)($data["employeeName"] ?? ""));
$department = trim((string)($data["department"] ?? ""));
$affectedIssue = trim((string)($data["affectedIssue"] ?? ""));
$description = trim((string)($data["description"] ?? ""));
$issueCategory = trim((string)($data["issueCategory"] ?? ""));
$deviceType = trim((string)($data["deviceType"] ?? ""));
$connectionType = trim((string)($data["connectionType"] ?? ""));
$location = trim((string)($data["location"] ?? ""));
$severity = trim((string)($data["severity"] ?? "Low"));
$classification = trim((string)($data["classification"] ?? ""));
$summary = trim((string)($data["summary"] ?? ""));
$troubleshooting = trim((string)($data["troubleshooting"] ?? ""));

/*
|--------------------------------------------------------------------------
| Validate required fields
|--------------------------------------------------------------------------
*/

if (
    $userId === "" ||
    $employeeName === "" ||
    $department === "" ||
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

if (!in_array($severity, $allowedSeverity, true)) {
    $severity = "Low";
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

$status = "Pending";
$assigned = "No";

/*
|--------------------------------------------------------------------------
| Insert incident into MySQL
|--------------------------------------------------------------------------
|
| We intentionally use exactly 15 placeholders.
|
*/

$sql = "
    INSERT INTO incidents (
        incidentID,
        affectedIssue,
        classification,
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
        assigned
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
| 16 placeholders = 16 variables
|
*/

$stmt->bind_param(
    "ssssssssssssssss",
    $incidentID,
    $affectedIssue,
    $classification,
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
    $assigned
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
    "incidentID" => $incidentID
]);

$stmt->close();
$conn->close();

?>