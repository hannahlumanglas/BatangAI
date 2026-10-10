<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);
    exit;
}

$incidentID = trim($data["incidentID"] ?? "");
$status = trim($data["status"] ?? "");
$actorUserId = trim((string)($data["actorUserId"] ?? ""));

if ($incidentID === "" || $status === "" || $actorUserId === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Incident ID, status, and the current user are required."
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| VERIFY ACTIVE IT PERSONNEL
|--------------------------------------------------------------------------
|
| Only the active IT Personnel account assigned to the incident
| may update its status.
|
*/

$actorStmt = $conn->prepare(
    "SELECT userID, fullName, role, status
     FROM users
     WHERE userID = ?
     LIMIT 1"
);

$actorStmt->bind_param("s", $actorUserId);
$actorStmt->execute();

$actor = $actorStmt->get_result()->fetch_assoc();

$actorStmt->close();

if (
    !$actor ||
    !in_array(strtolower(trim((string)$actor["role"])), ["it personnel", "it support"], true) ||
    strtolower(trim((string)$actor["status"])) !== "active"
) {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Only the assigned active Technician may update this incident."
    ]);

    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| VERIFY INCIDENT ASSIGNMENT
|--------------------------------------------------------------------------
*/

$assignmentStmt = $conn->prepare(
    "SELECT incidentID, status
     FROM incidents
     WHERE incidentID = ?
       AND assignedTo = ?
     LIMIT 1"
);

$assignmentStmt->bind_param(
    "ss",
    $incidentID,
    $actorUserId
);

$assignmentStmt->execute();

$assignment = $assignmentStmt->get_result()->fetch_assoc();

$assignmentStmt->close();

if (!$assignment) {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "This incident is not assigned to the current Technician account."
    ]);

    $conn->close();
    exit;
}

$currentStatus = strtolower(trim((string) $assignment["status"]));
$requestedStatus = strtolower($status);

if (
    ($requestedStatus === "in progress" && $currentStatus !== "pending") ||
    ($requestedStatus === "resolved" && $currentStatus !== "in progress")
) {
    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "Resolved incidents cannot be edited or reopened."
    ]);

    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| TAKE ACTION
|--------------------------------------------------------------------------
|
| Pending -> In Progress
|
| startedAt is recorded only if it has not already been recorded.
|
*/

if ($status === "In Progress") {

    $sql = "
        UPDATE incidents
        SET
            status = 'In Progress',
            startedAt = COALESCE(startedAt, NOW())
        WHERE incidentID = ?
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare database query."
        ]);

        $conn->close();
        exit;
    }

    $stmt->bind_param("s", $incidentID);

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Incident status updated successfully.",
            "incidentID" => $incidentID,
            "status" => "In Progress"
        ]);

    } else {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to update incident status."
        ]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| RESOLVE INCIDENT
|--------------------------------------------------------------------------
|
| In Progress -> Resolved
|
| The system records:
|
| - status
| - resolvedAt
| - resolvedBy
| - resolutionNotes
| - durationMinutes
|
| IMPORTANT:
| Duration is calculated by MariaDB using the same clock used
| for startedAt and resolvedAt.
|
*/

if ($status === "Resolved") {

    $resolvedBy = (int)$actor["userID"];

    $resolutionNotes = trim(
        $data["resolutionNotes"] ?? ""
    );
    $checkedTechnicianSteps = $data["technicianCheckedSteps"] ?? null;

    if (!is_array($checkedTechnicianSteps)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Complete every technician troubleshooting step before resolving this incident."]);
        $conn->close();
        exit;
    }

    if ($resolutionNotes === "") {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Resolution notes are required."
        ]);

        $conn->close();
        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | GET STARTED TIME
    |--------------------------------------------------------------------------
    */

    $selectSql = "
        SELECT startedAt, basicTroubleshootingChecklist, technicalTroubleshootingSuggestions
        FROM incidents
        WHERE incidentID = ?
        LIMIT 1
    ";

    $selectStmt = $conn->prepare($selectSql);

    if (!$selectStmt) {
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare incident lookup."
        ]);

        $conn->close();
        exit;
    }

    $selectStmt->bind_param(
        "s",
        $incidentID
    );

    if (!$selectStmt->execute()) {

        $selectStmt->close();

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to retrieve incident."
        ]);

        $conn->close();
        exit;
    }

    $result = $selectStmt->get_result();

    $incident = $result->fetch_assoc();

    $selectStmt->close();

    if (!$incident) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Incident not found."
        ]);

        $conn->close();
        exit;
    }

    $basicTroubleshooting = (string)($incident["basicTroubleshootingChecklist"] ?? "");
    $technicalTroubleshooting = (string)($incident["technicalTroubleshootingSuggestions"] ?? "");
    $troubleshooting = $basicTroubleshooting;
    if ($technicalTroubleshooting !== "") {
        $troubleshooting .= "\n\nIT Troubleshooting Suggestions:\n" . $technicalTroubleshooting;
    }
    $sections = preg_split('/^\s*IT Troubleshooting Suggestions:\s*$/im', $troubleshooting, 2);
    $technicianText = trim($sections[1] ?? "");
    $technicianText = preg_replace('/\[Employee checked self-help steps: [^\]]*\]/i', '', $technicianText);
    $technicianText = preg_replace('/\[IT checked troubleshooting steps: [^\]]*\]/i', '', $technicianText);
    $technicianLines = preg_split('/\s+(?=(?:\d+[.)]|[-*\x{2022}])\s+)/u', trim((string)$technicianText));
    $technicianLines = array_values(array_filter(array_map(function ($step) {
        return trim(preg_replace('/^\s*(?:\d+[.)]|[-*\x{2022}])\s*/u', '', $step));
    }, $technicianLines), function ($step) { return $step !== ""; }));
    $stepCount = count($technicianLines);
    $checkedTechnicianSteps = array_values(array_unique(array_map('intval', $checkedTechnicianSteps)));
    sort($checkedTechnicianSteps);
    if ($stepCount === 0 || count($checkedTechnicianSteps) !== $stepCount || $checkedTechnicianSteps !== range(0, $stepCount - 1)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Complete every technician troubleshooting step before resolving this incident."]);
        $conn->close();
        exit;
    }
    $troubleshooting = preg_replace('/\s*\[IT checked troubleshooting steps: [^\]]*\]/i', '', $troubleshooting);
    $troubleshooting = rtrim($troubleshooting) . "\n[IT checked troubleshooting steps: " . implode(',', $checkedTechnicianSteps) . "]";
    $savedSections = preg_split('/^\s*IT Troubleshooting Suggestions:\s*$/im', $troubleshooting, 2);
    $technicalTroubleshooting = trim((string)($savedSections[1] ?? ''));

    /*
    |--------------------------------------------------------------------------
    | UPDATE INCIDENT
    |--------------------------------------------------------------------------
    |
    | TIMESTAMPDIFF calculates the number of complete minutes between
    | startedAt and the database's current time.
    |
    | Both timestamps come from MariaDB, so there is no PHP/MySQL
    | timezone mismatch.
    |
    */

    $updateSql = "
        UPDATE incidents
        SET
            status = 'Resolved',
            resolvedAt = NOW(),
            resolvedBy = ?,
            resolutionNotes = ?,
            technicalTroubleshootingSuggestions = ?,
            durationMinutes =
                CASE
                    WHEN startedAt IS NULL THEN 0
                    ELSE GREATEST(
                        0,
                        TIMESTAMPDIFF(
                            MINUTE,
                            startedAt,
                            NOW()
                        )
                    )
                END
        WHERE incidentID = ?
    ";

    $updateStmt = $conn->prepare($updateSql);

    if (!$updateStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare resolution query."
        ]);

        $conn->close();
        exit;
    }

    $updateStmt->bind_param(
        "isss",
        $resolvedBy,
        $resolutionNotes,
        $technicalTroubleshooting,
        $incidentID
    );

    if (!$updateStmt->execute()) {

        $updateStmt->close();

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to resolve incident."
        ]);

        $conn->close();
        exit;
    }

    $updateStmt->close();

    /*
    |--------------------------------------------------------------------------
    | GET THE ACTUAL VALUES SAVED BY MYSQL
    |--------------------------------------------------------------------------
    */

    $resultStmt = $conn->prepare(
        "SELECT
            resolvedAt,
            durationMinutes
         FROM incidents
         WHERE incidentID = ?
         LIMIT 1"
    );

    if (!$resultStmt) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Incident was resolved, but the saved resolution details could not be retrieved."
        ]);

        $conn->close();
        exit;
    }

    $resultStmt->bind_param(
        "s",
        $incidentID
    );

    $resultStmt->execute();

    $savedResult = $resultStmt->get_result()->fetch_assoc();

    $resultStmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Incident resolved successfully.",
        "incidentID" => $incidentID,
        "status" => "Resolved",
        "resolvedBy" => $actor["fullName"],
        "resolvedAt" => $savedResult["resolvedAt"] ?? null,
        "durationMinutes" => (int)($savedResult["durationMinutes"] ?? 0)
    ]);

    $conn->close();
    exit;
}

/*
|--------------------------------------------------------------------------
| OTHER STATUS UPDATES
|--------------------------------------------------------------------------
|
| Allows:
|
| Pending
| In Progress
| Resolved
| Closed
|
| Resolution is handled separately above so that resolution
| information is also saved.
|
*/

$allowedStatuses = [
    "Pending",
    "In Progress",
    "Resolved",
    "Closed"
];

if (!in_array(
    $status,
    $allowedStatuses,
    true
)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid incident status."
    ]);

    $conn->close();
    exit;
}

$sql = "
    UPDATE incidents
    SET status = ?
    WHERE incidentID = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare database query."
    ]);

    $conn->close();
    exit;
}

$stmt->bind_param(
    "ss",
    $status,
    $incidentID
);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "Incident status updated successfully.",
        "incidentID" => $incidentID,
        "status" => $status
    ]);

} else {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to update incident status."
    ]);
}

$stmt->close();
$conn->close();

?>
