<?php

require_once "cors.php";
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit;
}

require_once "config.php";
require_once "auth_tokens.php";
$sessionUser = require_role_session($conn, ['Administrator', 'Secretary', 'IT Personnel', 'Employee']);
if ($sessionUser === null) {
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$incidentID = trim((string)($data["incidentID"] ?? ""));
$basic = trim((string)($data["basicSelfHelp"] ?? ""));
$technical = trim((string)($data["itTroubleshooting"] ?? ""));

if ($incidentID === "" || $basic === "" || $technical === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incident ID and both generated troubleshooting sections are required."]);
    $conn->close();
    exit;
}

$accessSql = "SELECT userId, assignedTo, basicTroubleshootingChecklist, technicalTroubleshootingSuggestions
              FROM incidents WHERE incidentID = ? LIMIT 1";
$stmt = $conn->prepare($accessSql);
$stmt->bind_param("s", $incidentID);
$stmt->execute();
$incident = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$incident) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Incident not found."]);
    $conn->close();
    exit;
}

$role = strtolower(trim((string)$sessionUser["role"]));
$userID = (string)$sessionUser["userID"];
$canView = in_array($role, ["administrator", "secretary"], true)
    || ($role === "employee" && (string)$incident["userId"] === $userID)
    || ($role === "it personnel" && (string)$incident["assignedTo"] === $userID);

if (!$canView) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "You do not have access to this incident."]);
    $conn->close();
    exit;
}

// Fill missing AI guidance only. Never overwrite existing guidance or technician progress.
$save = $conn->prepare("UPDATE incidents
    SET basicTroubleshootingChecklist = IF(NULLIF(TRIM(basicTroubleshootingChecklist), '') IS NULL, ?, basicTroubleshootingChecklist),
        technicalTroubleshootingSuggestions = IF(NULLIF(TRIM(technicalTroubleshootingSuggestions), '') IS NULL, ?, technicalTroubleshootingSuggestions)
    WHERE incidentID = ?");
$save->bind_param("sss", $basic, $technical, $incidentID);
if (!$save->execute()) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to save AI troubleshooting guidance."]);
    $save->close();
    $conn->close();
    exit;
}
$save->close();

$saved = $conn->prepare("SELECT basicTroubleshootingChecklist, technicalTroubleshootingSuggestions
    FROM incidents WHERE incidentID = ? LIMIT 1");
$saved->bind_param("s", $incidentID);
$saved->execute();
$guidance = $saved->get_result()->fetch_assoc();
$saved->close();
$conn->close();

echo json_encode([
    "success" => true,
    "basicSelfHelp" => (string)($guidance["basicTroubleshootingChecklist"] ?? ""),
    "itTroubleshooting" => (string)($guidance["technicalTroubleshootingSuggestions"] ?? ""),
]);
