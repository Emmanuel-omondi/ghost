<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$deviceId = $_GET['device_id'] ?? null;
$parentEmail = $_GET['parent_email'] ?? null;

if (!$deviceId || !$parentEmail) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing device_id or parent_email']);
    exit;
}

try {
    $conn = new mysqli(
        getenv('DB_HOST') ?: 'localhost',
        getenv('DB_USER') ?: 'root',
        getenv('DB_PASS') ?: '',
        getenv('DB_NAME') ?: 'ghostmonitor'
    );

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }

    // Update device last_seen
    $stmt = $conn->prepare("UPDATE devices SET last_seen = NOW() WHERE device_id = ? AND parent_email = ?");
    $stmt->bind_param('ss', $deviceId, $parentEmail);
    $stmt->execute();
    $stmt->close();

    $conn->close();

    http_response_code(200);
    echo json_encode(['success' => true, 'timestamp' => time()]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
