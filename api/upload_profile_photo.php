<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// Handle browser preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

require_once "config.php";

// --------------------------------------------------
// 1. Get user ID
// --------------------------------------------------

$userID = trim($_POST['userID'] ?? '');

if ($userID === '') {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "User ID is required."
    ]);
    exit;
}

// --------------------------------------------------
// 2. Check uploaded file
// --------------------------------------------------

if (!isset($_FILES['profilePhoto'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "No profile photo was uploaded."
    ]);
    exit;
}

$file = $_FILES['profilePhoto'];

// Check upload error
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);

    $message = "Failed to upload profile photo.";

    switch ($file['error']) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            $message = "The profile photo is too large.";
            break;

        case UPLOAD_ERR_PARTIAL:
            $message = "The profile photo was only partially uploaded.";
            break;

        case UPLOAD_ERR_NO_FILE:
            $message = "No profile photo was selected.";
            break;
    }

    echo json_encode([
        "success" => false,
        "message" => $message
    ]);
    exit;
}

// --------------------------------------------------
// 3. File size limit: 5 MB
// --------------------------------------------------

$maxFileSize = 5 * 1024 * 1024;

if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Profile photo must not exceed 5 MB."
    ]);
    exit;
}

// --------------------------------------------------
// 4. Verify that the file is actually an image
// --------------------------------------------------

$imageInfo = @getimagesize($file['tmp_name']);

if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "The uploaded file is not a valid image."
    ]);
    exit;
}

// --------------------------------------------------
// 5. Allow only specific image types
// --------------------------------------------------

$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp'
];

$mimeType = $imageInfo['mime'];

if (!isset($allowedMimeTypes[$mimeType])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Only JPG, PNG, and WEBP images are allowed."
    ]);
    exit;
}

$extension = $allowedMimeTypes[$mimeType];

// --------------------------------------------------
// 6. Check if user exists
// --------------------------------------------------

$checkSql = "
    SELECT userID, profilePhoto
    FROM users
    WHERE userID = ?
    LIMIT 1
";

$checkStmt = $conn->prepare($checkSql);

if (!$checkStmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare user query."
    ]);
    exit;
}

$checkStmt->bind_param("s", $userID);
$checkStmt->execute();

$result = $checkStmt->get_result();
$user = $result->fetch_assoc();

$checkStmt->close();

if (!$user) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "User account not found."
    ]);
    exit;
}

// --------------------------------------------------
// 7. Create upload directory
// --------------------------------------------------

$uploadDirectory = __DIR__ . '/../uploads/profile_photos/';

if (!is_dir($uploadDirectory)) {
    if (!mkdir($uploadDirectory, 0755, true)) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to create profile photo directory."
        ]);
        exit;
    }
}

// --------------------------------------------------
// 8. Generate a safe unique filename
// --------------------------------------------------

$randomPart = bin2hex(random_bytes(8));

$newFileName =
    'user_' .
    preg_replace('/[^0-9A-Za-z_-]/', '', $userID) .
    '_' .
    time() .
    '_' .
    $randomPart .
    '.' .
    $extension;

$destination = $uploadDirectory . $newFileName;

// --------------------------------------------------
// 9. Move uploaded file
// --------------------------------------------------

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to save profile photo."
    ]);
    exit;
}

// --------------------------------------------------
// 10. Update profilePhoto in database
// --------------------------------------------------

$updateSql = "
    UPDATE users
    SET profilePhoto = ?
    WHERE userID = ?
";

$updateStmt = $conn->prepare($updateSql);

if (!$updateStmt) {

    // Remove uploaded file if database update cannot be prepared
    if (file_exists($destination)) {
        unlink($destination);
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare profile photo update."
    ]);
    exit;
}

$updateStmt->bind_param("ss", $newFileName, $userID);

if (!$updateStmt->execute()) {

    // Remove uploaded file if database update fails
    if (file_exists($destination)) {
        unlink($destination);
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update profile photo.",
        "error" => $updateStmt->error
    ]);

    $updateStmt->close();
    $conn->close();
    exit;
}

$updateStmt->close();

// --------------------------------------------------
// 11. Delete old profile photo
// --------------------------------------------------

$oldFileName = $user['profilePhoto'] ?? '';

if (
    $oldFileName !== '' &&
    !filter_var($oldFileName, FILTER_VALIDATE_URL) &&
    strpos($oldFileName, 'data:') !== 0
) {
    $oldFilePath = $uploadDirectory . basename($oldFileName);

    if (
        file_exists($oldFilePath) &&
        $oldFilePath !== $destination
    ) {
        unlink($oldFilePath);
    }
}

// --------------------------------------------------
// 12. Return success
// --------------------------------------------------

echo json_encode([
    "success" => true,
    "message" => "Profile photo updated successfully.",
    "profilePhoto" => $newFileName,
    "profilePhotoUrl" =>
        "http://localhost/BatangAI/uploads/profile_photos/" . $newFileName
]);

$conn->close();

?>