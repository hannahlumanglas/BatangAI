<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

require_once "config.php";

$userID = isset($_GET["userID"]) ? trim($_GET["userID"]) : "";

if ($userID === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "userID is required."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Get logged-in user's role
|--------------------------------------------------------------------------
*/

$userSql = "
    SELECT userID, role, status
    FROM users
    WHERE userID = ?
    LIMIT 1
";

$userStmt = $conn->prepare($userSql);

if (!$userStmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare user query.",
        "error" => $conn->error
    ]);
    $conn->close();
    exit;
}

$userStmt->bind_param("s", $userID);

if (!$userStmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to execute user query.",
        "error" => $userStmt->error
    ]);
    $userStmt->close();
    $conn->close();
    exit;
}

$userStmt->store_result();

if ($userStmt->num_rows === 0) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "User not found."
    ]);
    $userStmt->close();
    $conn->close();
    exit;
}

$userStmt->bind_result(
    $dbUserID,
    $dbRole,
    $dbStatus
);

$userStmt->fetch();

$userStmt->close();

/*
|--------------------------------------------------------------------------
| Block inactive users
|--------------------------------------------------------------------------
*/

if (strcasecmp((string)$dbStatus, "Active") !== 0) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "User account is inactive."
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Normalize role
|--------------------------------------------------------------------------
*/

$role = trim((string)$dbRole);

if (strcasecmp($role, "Admin") === 0) {
    $role = "Administrator";
}

/*
|--------------------------------------------------------------------------
| Build incident query according to role
|--------------------------------------------------------------------------
*/

$sql = "
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
    LEFT JOIN users AS reporter
        ON reporter.userID = incidents.userId
    LEFT JOIN users AS assignee
        ON assignee.userID = incidents.assignedTo
";

if (strcasecmp($role, "Employee") === 0) {

    $sql .= "
        WHERE incidents.userId = ?
        ORDER BY incidents.createdAt DESC
    ";

} elseif (strcasecmp($role, "IT Personnel") === 0) {

    $sql .= "
        WHERE incidents.assignedTo = ?
        ORDER BY incidents.createdAt DESC
    ";

} else {

    // Administrator and Secretary can view all incidents.

    $sql .= "
        ORDER BY incidents.createdAt DESC
    ";
}

/*
|--------------------------------------------------------------------------
| Prepare incident query
|--------------------------------------------------------------------------
*/

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare incident query.",
        "error" => $conn->error
    ]);
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Bind user ID only for Employee / IT Personnel
|--------------------------------------------------------------------------
*/

if (
    strcasecmp($role, "Employee") === 0 ||
    strcasecmp($role, "IT Personnel") === 0
) {
    $stmt->bind_param("s", $userID);
}

/*
|--------------------------------------------------------------------------
| Execute incident query
|--------------------------------------------------------------------------
*/

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve incident reports.",
        "error" => $stmt->error
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| Retrieve results
|--------------------------------------------------------------------------
*/

$stmt->store_result();

$stmt->bind_result(
    $incidentID,
    $affectedIssue,
    $classification,
    $connectionType,
    $createdAt,
    $department,
    $description,
    $deviceType,
    $employeeName,
    $issueCategory,
    $location,
    $resolvedAt,
    $resolvedBy,
    $severity,
    $status,
    $summary,
    $troubleshooting,
    $incidentUserId,
    $assigned,
    $assignedAt,
    $assignedTo,
    $assignedToName,
    $durationMinutes,
    $resolutionNotes,
    $startedAt,
    $reporterProfilePhoto,
    $assignedToProfilePhoto
);

$incidents = [];

while ($stmt->fetch()) {

    $incidents[] = [
        "incidentID" => $incidentID,
        "affectedIssue" => $affectedIssue,
        "classification" => $classification,
        "connectionType" => $connectionType,
        "createdAt" => $createdAt,
        "department" => $department,
        "description" => $description,
        "deviceType" => $deviceType,
        "employeeName" => $employeeName,
        "issueCategory" => $issueCategory,
        "location" => $location,
        "resolvedAt" => $resolvedAt,
        "resolvedBy" => $resolvedBy,
        "severity" => $severity,
        "status" => $status,
        "summary" => $summary,
        "troubleshooting" => $troubleshooting,
        "userId" => $incidentUserId,
        "assigned" => $assigned,
        "assignedAt" => $assignedAt,
        "assignedTo" => $assignedTo,
        "assignedToName" => $assignedToName,
        "durationMinutes" => $durationMinutes,
        "resolutionNotes" => $resolutionNotes,
        "startedAt" => $startedAt,
        "reporterProfilePhoto" => $reporterProfilePhoto,
        "assignedToProfilePhoto" => $assignedToProfilePhoto
    ];
}

/*
|--------------------------------------------------------------------------
| Return JSON
|--------------------------------------------------------------------------
*/

echo json_encode([
    "success" => true,
    "count" => count($incidents),
    "incidents" => $incidents
]);

$stmt->close();
$conn->close();

?>