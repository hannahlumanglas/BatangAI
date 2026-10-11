<?php
require_once 'cors.php';
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Method not allowed.']); exit; }
require_once 'config.php';
$result = $conn->query('SELECT catalogGroup, catalogValue FROM system_catalogs WHERE active = 1 ORDER BY catalogGroup, sortOrder, catalogValue');
if (!$result) { error_log('system_options.php: ' . $conn->error); http_response_code(500); echo json_encode(['success' => false, 'message' => 'System options are not configured. Apply database/migrations/add_system_catalogs.sql.']); $conn->close(); exit; }
$options = [];
while ($row = $result->fetch_assoc()) $options[$row['catalogGroup']][] = $row['catalogValue'];
echo json_encode(['success' => true, 'options' => $options]);
$conn->close();
?>
