<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

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
| Get all incidents
|--------------------------------------------------------------------------
|
| Newest incidents appear first.
|
*/

$sql = "
    SELECT
        incidentID,
        affectedIssue,
        classification,
        connectionType,
        createdAt,
        department,
        description,
        deviceType,
        employeeName,
        issueCategory,
        location,
        resolvedAt,
        resolvedBy,
        severity,
        status,
        summary,
        troubleshooting,
        userId,
        assigned,
        assignedAt,
        assignedTo,
        assignedToName,
        durationMinutes,
        resolutionNotes,
        startedAt
    FROM incidents
    ORDER BY createdAt DESC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve incidents.",
        "error" => $conn->error
    ]);

    $conn->close();
    exit;
}

$incidents = [];

while ($row = $result->fetch_assoc()) {
    $incidents[] = [
        "incidentID" => $row["incidentID"],
        "affectedIssue" => $row["affectedIssue"],
        "classification" => $row["classification"],
        "connectionType" => $row["connectionType"],
        "createdAt" => $row["createdAt"],
        "department" => $row["department"],
        "description" => $row["description"],
        "deviceType" => $row["deviceType"],
        "employeeName" => $row["employeeName"],
        "issueCategory" => $row["issueCategory"],
        "location" => $row["location"],
        "resolvedAt" => $row["resolvedAt"],
        "resolvedBy" => $row["resolvedBy"],
        "severity" => $row["severity"],
        "status" => $row["status"],
        "summary" => $row["summary"],
        "troubleshooting" => $row["troubleshooting"],
        "userId" => $row["userId"],
        "assigned" => $row["assigned"],
        "assignedAt" => $row["assignedAt"],
        "assignedTo" => $row["assignedTo"],
        "assignedToName" => $row["assignedToName"],
        "durationMinutes" => $row["durationMinutes"],
        "resolutionNotes" => $row["resolutionNotes"],
        "startedAt" => $row["startedAt"]
    ];
}

echo json_encode([
    "success" => true,
    "count" => count($incidents),
    "incidents" => $incidents
]);

$conn->close();
?>