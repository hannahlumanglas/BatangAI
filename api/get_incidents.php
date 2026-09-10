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
| Get all incidents
|--------------------------------------------------------------------------
|
| The All Incidents page needs the complete incident record from MySQL.
| Results are ordered from newest to oldest.
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
$conn->close();

?>