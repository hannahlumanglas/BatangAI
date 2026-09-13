<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Method not allowed.']); exit; }
require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);
$action = trim((string)($data['action'] ?? ''));
$userID = trim((string)($data['userID'] ?? ''));
function fail($conn, $message, $status = 400) { http_response_code($status); echo json_encode(['success' => false, 'message' => $message]); $conn->close(); exit; }
if ($userID === '' || !ctype_digit($userID)) fail($conn, 'A valid user is required.');
if ($action === 'update') {
  $fullName = trim((string)($data['fullName'] ?? '')); $employeeId = trim((string)($data['employeeId'] ?? '')); $email = strtolower(trim((string)($data['email'] ?? ''))); $department = trim((string)($data['department'] ?? '')); $role = trim((string)($data['role'] ?? ''));
  $allowedRoles = ['Employee', 'Secretary', 'IT Personnel', 'Administrator'];
  if ($fullName === '' || $employeeId === '' || $department === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, $allowedRoles, true)) fail($conn, 'Please provide valid account details.');
  $check = $conn->prepare('SELECT userID FROM users WHERE (LOWER(email) = ? OR employeeId = ?) AND userID <> ? LIMIT 1'); $check->bind_param('ssi', $email, $employeeId, $userID); $check->execute();
  if ($check->get_result()->num_rows > 0) { $check->close(); fail($conn, 'Email address or Employee ID is already used by another account.', 409); } $check->close();
  $databaseRole = $role === 'Administrator' ? 'Admin' : $role; $stmt = $conn->prepare('UPDATE users SET fullName = ?, employeeId = ?, email = ?, department = ?, role = ? WHERE userID = ?'); $stmt->bind_param('sssssi', $fullName, $employeeId, $email, $department, $databaseRole, $userID);
} elseif ($action === 'self_password') {
  $currentPassword = (string)($data['currentPassword'] ?? '');
  $password = (string)($data['password'] ?? '');
  if ($currentPassword === '') fail($conn, 'Enter your current password.');
  if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) fail($conn, 'Password must have 8+ characters with uppercase, lowercase, number, and special character.');
  $current = $conn->prepare('SELECT password FROM users WHERE userID = ? LIMIT 1'); $current->bind_param('i', $userID); $current->execute(); $account = $current->get_result()->fetch_assoc(); $current->close();
  if (!$account || !password_verify($currentPassword, $account['password'])) fail($conn, 'Current password is incorrect.', 401);
  $passwordHash = password_hash($password, PASSWORD_DEFAULT); $stmt = $conn->prepare('UPDATE users SET password = ? WHERE userID = ?'); $stmt->bind_param('si', $passwordHash, $userID);
} elseif ($action === 'password') {
  $password = (string)($data['password'] ?? ''); if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) fail($conn, 'Password must have 8+ characters with uppercase, lowercase, number, and special character.');
  $passwordHash = password_hash($password, PASSWORD_DEFAULT); $stmt = $conn->prepare('UPDATE users SET password = ? WHERE userID = ?'); $stmt->bind_param('si', $passwordHash, $userID);
} elseif ($action === 'status') {
  $status = trim((string)($data['status'] ?? '')); if (!in_array($status, ['Active', 'Inactive'], true)) fail($conn, 'Invalid account status.'); $stmt = $conn->prepare('UPDATE users SET status = ? WHERE userID = ?'); $stmt->bind_param('si', $status, $userID);
} else fail($conn, 'Invalid user-management action.');
if (!$stmt || !$stmt->execute()) fail($conn, 'Unable to update the user.', 500);
if ($stmt->affected_rows === 0) { $stmt->close(); fail($conn, 'User not found or no changes were made.', 404); }
$stmt->close(); $conn->close(); echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
