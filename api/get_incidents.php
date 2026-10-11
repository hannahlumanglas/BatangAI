<?php

require_once "cors.php";
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
require_once "auth_tokens.php";
$sessionUser = require_role_session($conn, ['Administrator', 'Secretary', 'IT Personnel', 'Employee']);
if ($sessionUser === null) { $conn->close(); exit; }
$userID = (string)$sessionUser['userID'];
$requestedUserID = trim((string)($_GET['userID'] ?? ''));
if ($requestedUserID !== '' && $requestedUserID !== $userID) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'The requested account does not match the authenticated session.']);
    $conn->close(); exit;
}
$role = (string)$sessionUser['role'];
$requestedScope = strtolower(trim((string)($_GET['scope'] ?? '')));

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
        COALESCE(incidents.keywords, '[]') AS keywords,
        incidents.connectionType,
        incidents.createdAt,
        incidents.department,
        incidents.description,
        incidents.deviceType,
        incidents.employeeName,
        incidents.issueCategory,
        incidents.location,
        incidents.resolvedAt,
        COALESCE(resolvedUser.fullName, CAST(incidents.resolvedBy AS CHAR)) AS resolvedBy,
        incidents.severity,
        incidents.status,
        incidents.summary,
        CONCAT_WS('\n\n',
            NULLIF(incidents.basicTroubleshootingChecklist, ''),
            IF(NULLIF(incidents.technicalTroubleshootingSuggestions, '') IS NULL, NULL,
                CONCAT('IT Troubleshooting Suggestions:\n', incidents.technicalTroubleshootingSuggestions))
        ) AS troubleshooting,
        incidents.userId,
        IF(incidents.assigned = 1, 'Yes', 'No') AS assigned,
        incidents.assignedAt,
        incidents.assignedTo,
        COALESCE(NULLIF(assignee.fullName, ''), NULLIF(incidents.assignedToName, '')) AS assignedToName,
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
    LEFT JOIN users AS resolvedUser
        ON resolvedUser.userID = incidents.resolvedBy
";

if (strcasecmp($role, "Employee") === 0) {

    $sql .= "
        WHERE incidents.userId = ?
        ORDER BY incidents.createdAt DESC
    ";

} elseif (strcasecmp($role, "IT Personnel") === 0 && $requestedScope !== 'all') {

    $sql .= "
        WHERE incidents.assignedTo = ? OR EXISTS (
            SELECT 1 FROM incident_sub_assignments isa
            WHERE isa.incidentID = incidents.incidentID AND isa.userID = ?
        )
        ORDER BY incidents.createdAt DESC
    ";

} else {

    // Administrator and Secretary can view all incidents. IT can request the
    // all-incidents view explicitly; My Assignments remains assigned-only.

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
| Bind user ID for employee reports and technician assignments
|--------------------------------------------------------------------------
*/

if (
    strcasecmp($role, "Employee") === 0 ||
    (strcasecmp($role, "IT Personnel") === 0 && $requestedScope !== 'all')
) {
    if (strcasecmp($role, "IT Personnel") === 0) $stmt->bind_param("ss", $userID, $userID);
    else $stmt->bind_param("s", $userID);
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
    $keywords,
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

    $decodedKeywords = json_decode($keywords ?: "[]", true);
    if (!is_array($decodedKeywords)) {
        $decodedKeywords = [];
    }

    $incidentSubs = [];
    $subsStmt = $conn->prepare("SELECT isa.userID, u.fullName FROM incident_sub_assignments isa JOIN users u ON u.userID = isa.userID WHERE isa.incidentID = ? ORDER BY u.fullName");
    $subsStmt->bind_param('s', $incidentID); $subsStmt->execute(); $subsResult = $subsStmt->get_result();
    while ($subRow = $subsResult->fetch_assoc()) $incidentSubs[] = $subRow;
    $subsStmt->close();

    $incidents[] = [
        "incidentID" => $incidentID,
        "affectedIssue" => $affectedIssue,
        "classification" => $classification,
        "keywords" => $decodedKeywords,
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
        "reporterProfilePhoto" => is_string($reporterProfilePhoto) ? basename($reporterProfilePhoto) : $reporterProfilePhoto,
        "assignedToProfilePhoto" => is_string($assignedToProfilePhoto) ? basename($assignedToProfilePhoto) : $assignedToProfilePhoto,
        "subAssignments" => $incidentSubs
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
