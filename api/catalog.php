<?php
function is_active_catalog_value(mysqli $conn, string $group, string $value): bool {
    $stmt = $conn->prepare('SELECT catalogID FROM system_catalogs WHERE catalogGroup = ? AND catalogValue = ? AND active = 1 LIMIT 1');
    if (!$stmt) return false;
    $stmt->bind_param('ss', $group, $value);
    $stmt->execute();
    $stmt->store_result();
    $valid = $stmt->num_rows === 1;
    $stmt->close();
    return $valid;
}
?>
