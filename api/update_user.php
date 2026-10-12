<?php
require_once "cors.php";
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");
// PHP/MySQL errors must not be printed as HTML before the JSON response.
ini_set('display_errors', '0');
set_exception_handler(function ($error) {
  error_log('update_user.php: ' . $error->getMessage());
  if (!headers_sent()) {
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");
  }
  echo json_encode(['success' => false, 'message' => 'The server could not update this account. Check the PHP error log for details.']);
  exit;
});
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Method not allowed.']); exit; }
require_once 'config.php';
require_once 'catalog.php';
require_once 'security_policy.php';
$data = json_decode(file_get_contents('php://input'), true);
$action = trim((string)($data['action'] ?? ''));
$userID = trim((string)($data['userID'] ?? ''));
function fail($conn, $message, $status = 400) { http_response_code($status); echo json_encode(['success' => false, 'message' => $message]); $conn->close(); exit; }
function employee_id_prefix_for_role($role) {
  $prefixes = ['Employee' => 'EMP', 'Secretary' => 'SEC', 'IT Personnel' => 'ITS', 'Technician' => 'ITS', 'IT Support' => 'ITS', 'Administrator' => 'ADM', 'Admin' => 'ADM'];
  return $prefixes[$role] ?? null;
}
function next_employee_id($conn, $role) {
  $prefix = employee_id_prefix_for_role($role);
  if ($prefix === null) return null;
  $query = $conn->prepare('SELECT employeeId FROM users WHERE employeeId LIKE ? FOR UPDATE');
  $pattern = $prefix . '%'; $query->bind_param('s', $pattern); $query->execute();
  $result = $query->get_result(); $max = 0;
  while ($row = $result->fetch_assoc()) {
    if (preg_match('/^' . preg_quote($prefix, '/') . '([0-9]+)$/i', trim((string)$row['employeeId']), $matches)) $max = max($max, (int)$matches[1]);
  }
  $query->close();
  return $prefix . str_pad((string)($max + 1), 2, '0', STR_PAD_LEFT);
}
if ($userID === '' || !ctype_digit($userID)) fail($conn, 'A valid user is required.');
if ($action === 'update') {
  $fullName = trim((string)($data['fullName'] ?? '')); $email = strtolower(trim((string)($data['email'] ?? ''))); $department = trim((string)($data['department'] ?? '')); $role = trim((string)($data['role'] ?? ''));
  if ($fullName === '' || $department === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !is_active_catalog_value($conn, 'user_role', $role) || employee_id_prefix_for_role($role) === null) fail($conn, 'Please provide valid account details.');
  $officeCheck = $conn->prepare('SELECT officeID FROM offices WHERE officeName = ? AND active = 1 LIMIT 1');
  if (!$officeCheck) fail($conn, 'Unable to validate the selected Office.', 500);
  $officeCheck->bind_param('s', $department); $officeCheck->execute(); $officeCheck->store_result();
  $validOffice = $officeCheck->num_rows === 1; $officeCheck->close();
  if (!$validOffice) fail($conn, 'Please select an active Office from the list.');
  $emailCheck = $conn->prepare('SELECT userID FROM users WHERE LOWER(email) = ? AND userID <> ? LIMIT 1');
  if (!$emailCheck) fail($conn, 'Unable to verify the email address.', 500);
  $emailCheck->bind_param('si', $email, $userID);
  $emailCheck->execute();
  $emailCheck->store_result();
  $duplicateEmail = $emailCheck->num_rows > 0;
  $emailCheck->close();
  if ($duplicateEmail) fail($conn, 'This email address is already used by another account.', 409);
  $databaseRole = $role === 'IT Personnel' ? 'Technician' : $role;
  $conn->begin_transaction();
  $current = $conn->prepare('SELECT employeeId FROM users WHERE userID = ? FOR UPDATE');
  $current->bind_param('i', $userID); $current->execute(); $currentRow = $current->get_result()->fetch_assoc(); $current->close();
  if (!$currentRow) { $conn->rollback(); fail($conn, 'User not found.', 404); }
  $targetPrefix = employee_id_prefix_for_role($databaseRole);
  $employeeId = (string)$currentRow['employeeId'];
  if (!preg_match('/^' . preg_quote($targetPrefix, '/') . '[0-9]+$/i', $employeeId)) {
    $employeeId = next_employee_id($conn, $databaseRole);
  }
  $stmt = $conn->prepare('UPDATE users SET fullName = ?, employeeId = ?, email = ?, department = ?, role = ? WHERE userID = ?');
  if (!$stmt) fail($conn, 'Unable to prepare the account update.', 500);
  $stmt->bind_param('sssssi', $fullName, $employeeId, $email, $department, $databaseRole, $userID);
  $transactionalUpdate = true;
} elseif ($action === 'self_password') {
  $currentPassword = (string)($data['currentPassword'] ?? '');
  $password = (string)($data['password'] ?? '');
  if ($currentPassword === '') fail($conn, 'Enter your current password.');
  $passwordError = password_policy_error($password); if ($passwordError !== null) fail($conn, $passwordError);
  $current = $conn->prepare('SELECT password FROM users WHERE userID = ? LIMIT 1');
  if (!$current) fail($conn, 'Unable to verify the account password.', 500);
  $current->bind_param('i', $userID); $current->execute(); $current->bind_result($storedPassword); $hasAccount = $current->fetch(); $current->close();
  if (!$hasAccount || !password_verify($currentPassword, $storedPassword)) fail($conn, 'Current password is incorrect.', 401);
  $passwordHash = password_hash($password, PASSWORD_DEFAULT); $stmt = $conn->prepare('UPDATE users SET password = ? WHERE userID = ?'); $stmt->bind_param('si', $passwordHash, $userID);
} elseif ($action === 'password') {
  $password = (string)($data['password'] ?? ''); $passwordError = password_policy_error($password); if ($passwordError !== null) fail($conn, $passwordError);
  $passwordHash = password_hash($password, PASSWORD_DEFAULT); $stmt = $conn->prepare('UPDATE users SET password = ? WHERE userID = ?'); $stmt->bind_param('si', $passwordHash, $userID);
} elseif ($action === 'status') {
  $status = trim((string)($data['status'] ?? '')); if (!in_array($status, ['Active', 'Inactive'], true)) fail($conn, 'Invalid account status.'); $stmt = $conn->prepare('UPDATE users SET status = ? WHERE userID = ?'); $stmt->bind_param('si', $status, $userID);
} else fail($conn, 'Invalid user-management action.');
if (!$stmt || !$stmt->execute()) { if (!empty($transactionalUpdate)) $conn->rollback(); fail($conn, 'Unable to update the user.', 500); }
if ($stmt->affected_rows === 0) {
  // MySQL reports zero affected rows both when the user does not exist and
  // when the submitted values already match the stored values. Treat the
  // latter as a successful save so an unchanged form does not show an error.
  $stmt->close();
  $checkUser = $conn->prepare('SELECT userID FROM users WHERE userID = ? LIMIT 1');
  if (!$checkUser) fail($conn, 'Unable to verify the user account.', 500);
  $checkUser->bind_param('i', $userID);
  $checkUser->execute();
  $checkUser->store_result();
  $userExists = $checkUser->num_rows > 0;
  $checkUser->close();
  if (!$userExists) fail($conn, 'User not found.', 404);
}
$stmt && !empty($transactionalUpdate) ? $conn->commit() : null;
$stmt->close(); $conn->close(); echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
