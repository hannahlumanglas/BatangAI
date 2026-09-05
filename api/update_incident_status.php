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
| When IT Personnel takes an assigned incident:
| Pending -> In Progress
| startedAt is recorded.
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

        if ($stmt->affected_rows >= 0) {
            echo json_encode([
                "success" => true,
                "message" => "Incident status updated successfully.",
                "incidentID" => $incidentID,
                "status" => "In Progress"
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Incident not found."
            ]);
        }

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
| OTHER STATUS UPDATES
|--------------------------------------------------------------------------
| Allows future statuses such as Resolved.
*/

$allowedStatuses = [
    "Pending",
    "In Progress",
    "Resolved",
    "Closed"
];

if (!in_array($status, $allowedStatuses, true)) {
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

$stmt->bind_param("ss", $status, $incidentID);

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