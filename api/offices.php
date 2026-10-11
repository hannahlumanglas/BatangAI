<?php
require_once "cors.php";
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Method not allowed.']); exit; }
require_once "config.php";
try {
    $result = $conn->query('SELECT officeName FROM offices WHERE active = 1 ORDER BY sortOrder, officeName');
    $offices = [];
    while ($row = $result->fetch_assoc()) $offices[] = $row['officeName'];
    echo json_encode(['success' => true, 'offices' => $offices]);
} catch (Throwable $error) {
    error_log('offices.php: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load the Office list. Apply database/migrations/add_offices.sql.']);
}
$conn->close();
?>
