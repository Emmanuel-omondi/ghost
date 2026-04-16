<?php
// Called by the Android app periodically to mark device as online
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Device-ID, X-Parent-Email, Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require '../config.php';

$parent_email = trim($_GET['parent_email'] ?? $_SERVER['HTTP_X_PARENT_EMAIL'] ?? '');
$device_id    = trim($_GET['device_id']    ?? $_SERVER['HTTP_X_DEVICE_ID']    ?? '');

if (empty($parent_email) || empty($device_id)) {
    http_response_code(400);
    exit(json_encode(['error' => 'Missing credentials']));
}

try {
    // Upsert device last_seen
    $stmt = $pdo->prepare("
        INSERT INTO devices (device_id, parent_email, last_seen)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE last_seen = NOW()
    ");
    $stmt->execute([$device_id, $parent_email]);
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
