<?php
require_once "cors.php";
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "config.php";
require_once "auth_tokens.php";

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sessionUser = require_role_session($conn, ['Administrator', 'Secretary'], 'Only signed-in Administrators or Secretaries may view department coverage.');
    if ($sessionUser === null) { $conn->close(); exit; }
    try {
        $rows = $conn->query("SELECT da.id, da.department, da.primaryUserID, p.fullName AS primaryName FROM department_assignments da JOIN users p ON p.userID = da.primaryUserID ORDER BY da.department");
    } catch (Throwable $e) {
        http_response_code(500); echo json_encode(['success'=>false,'message'=>'Department coverage tables are unavailable. Apply database/migrations/add_sub_assignments.sql.']); $conn->close(); exit;
    }
    if (!$rows) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'Unable to load department assignments.']); $conn->close(); exit; }
    $assignments = [];
    while ($row = $rows->fetch_assoc()) {
        $row['subs'] = [];
        $subs = $conn->prepare("SELECT s.userID, u.fullName FROM department_assignment_subs s JOIN users u ON u.userID = s.userID WHERE s.assignmentID = ? ORDER BY u.fullName");
        $subs->bind_param('i', $row['id']); $subs->execute(); $result = $subs->get_result();
        while ($sub = $result->fetch_assoc()) $row['subs'][] = $sub;
        $subs->close(); $assignments[] = $row;
    }
    echo json_encode(['success'=>true,'assignments'=>$assignments]); $conn->close(); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed.']); $conn->close(); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$sessionUser = require_role_session($conn, ['Administrator'], 'Only an Administrator may manage department coverage.');
if ($sessionUser === null) { $conn->close(); exit; }
$department = trim((string)($data['department'] ?? ''));
$primary = trim((string)($data['primaryUserID'] ?? ''));
$rawSubs = is_array($data['subUserIDs'] ?? null) ? $data['subUserIDs'] : [];
$subs = array_values(array_unique(array_filter(array_map('strval', $rawSubs), fn($id) => $id !== '' && $id !== $primary)));
if ($department === '' || mb_strlen($department) > 150 || !$primary) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Department and primary technician are required.']); $conn->close(); exit; }
$ids = array_merge([$primary], $subs);
foreach ($ids as $id) { if (!ctype_digit($id)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Invalid technician selected.']); $conn->close(); exit; } }
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$check = $conn->prepare("SELECT userID FROM users WHERE userID IN ($placeholders) AND role IN ('IT Personnel','IT Support') AND LOWER(status) = 'active'");
$check->bind_param(str_repeat('s', count($ids)), ...$ids); $check->execute(); $validCount = $check->get_result()->num_rows; $check->close();
if ($validCount !== count($ids)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Choose active technician accounts for the primary and SUB roles.']); $conn->close(); exit; }
$conn->begin_transaction();
try {
    $stmt = $conn->prepare('INSERT INTO department_assignments (department, primaryUserID) VALUES (?, ?) ON DUPLICATE KEY UPDATE primaryUserID = VALUES(primaryUserID)');
    $stmt->bind_param('ss', $department, $primary); $stmt->execute(); $stmt->close();
    $find = $conn->prepare('SELECT id FROM department_assignments WHERE department = ?'); $find->bind_param('s', $department); $find->execute(); $assignmentID = (int)$find->get_result()->fetch_assoc()['id']; $find->close();
    $del = $conn->prepare('DELETE FROM department_assignment_subs WHERE assignmentID = ?'); $del->bind_param('i', $assignmentID); $del->execute(); $del->close();
    if ($subs) { $insert = $conn->prepare('INSERT INTO department_assignment_subs (assignmentID, userID) VALUES (?, ?)'); foreach ($subs as $sub) { $insert->bind_param('is', $assignmentID, $sub); $insert->execute(); } $insert->close(); }
    $conn->commit(); echo json_encode(['success'=>true,'message'=>'Department coverage saved.']);
} catch (Throwable $e) { $conn->rollback(); http_response_code(500); echo json_encode(['success'=>false,'message'=>'Unable to save department coverage.']); }
$conn->close();
?>
