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

if ($incidentID === "" || $status === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Incident ID and status are required."
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| TAKE ACTION
|--------------------------------------------------------------------------
|
| When IT Personnel takes an assigned incident:
|
| Pending -> In Progress
|
| startedAt is recorded only if it has not
| already been recorded.
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
| When IT Personnel resolves an incident:
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
*/

if ($status === "Resolved") {

    $resolvedBy = trim(
        $data["resolvedBy"] ?? ""
    );

    $resolutionNotes = trim(
        $data["resolutionNotes"] ?? ""
    );

    if ($resolutionNotes === "") {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Resolution notes are required."
        ]);

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | Get the incident's startedAt first.
    |--------------------------------------------------------------------------
    */

    $selectSql = "
        SELECT
            startedAt
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

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate duration
    |--------------------------------------------------------------------------
    |
    | If startedAt exists:
    |
    | durationMinutes = minutes between startedAt and NOW()
    |
    | If startedAt is missing, duration is stored as 0.
    |
    */

    $durationMinutes = 0;

    if (!empty($incident["startedAt"])) {

        $startTime = new DateTime(
            $incident["startedAt"]
        );

        $endTime = new DateTime();

        $durationSeconds =
            $endTime->getTimestamp() -
            $startTime->getTimestamp();

        $durationMinutes = max(
            0,
            (int) floor(
                $durationSeconds / 60
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Update the incident
    |--------------------------------------------------------------------------
    */

    $updateSql = "
        UPDATE incidents
        SET
            status = 'Resolved',
            resolvedAt = NOW(),
            resolvedBy = ?,
            resolutionNotes = ?,
            durationMinutes = ?
        WHERE incidentID = ?
    ";

    $updateStmt = $conn->prepare(
        $updateSql
    );

    if (!$updateStmt) {
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare resolution query."
        ]);

        exit;
    }

    $updateStmt->bind_param(
        "ssis",
        $resolvedBy,
        $resolutionNotes,
        $durationMinutes,
        $incidentID
    );

    if ($updateStmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Incident resolved successfully.",
            "incidentID" => $incidentID,
            "status" => "Resolved",
            "resolvedBy" => $resolvedBy,
            "resolvedAt" => date("Y-m-d H:i:s"),
            "durationMinutes" => $durationMinutes
        ]);

    } else {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Failed to resolve incident."
        ]);
    }

    $updateStmt->close();
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
| Resolution is handled separately above so that
| resolution information is also saved.
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