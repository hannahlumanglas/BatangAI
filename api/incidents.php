<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "config.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

$sql = "
    SELECT
        i.incidentID,
        i.affectedIssue,
        i.classification,
        i.connectionType,
        i.createdAt,
        i.department,
        i.description,
        i.deviceType,
        i.employeeName,
        i.issueCategory,
        i.location,
        i.resolvedAt,
        i.resolvedBy,
        i.severity,
        i.status,
        i.summary,
        i.troubleshooting,
        i.userId,
        i.assigned,
        i.assignedAt,
        i.assignedTo,
        i.assignedToName,
        i.durationMinutes,
        i.resolutionNotes,
        i.startedAt,

        u.employeeId,
        u.email AS reporterEmail,
        u.fullName AS encodedBy

    FROM incidents i

    LEFT JOIN users u
        ON u.userID = i.userId

    ORDER BY i.createdAt DESC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve incidents.",
        "error" => $conn->error
    ]);

    exit;
}

$incidents = [];

while ($row = $result->fetch_assoc()) {
    $incidents[] = $row;
}

echo json_encode([
    "success" => true,
    "incidents" => $incidents
]);

$conn->close();
?>