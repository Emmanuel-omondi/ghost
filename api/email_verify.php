<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$email = $_POST['email'] ?? $_GET['email'] ?? null;

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing email']);
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

    // Check if email exists in licenses table
    $stmt = $conn->prepare("SELECT id FROM licenses WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $exists = $result->num_rows > 0;
    $stmt->close();

    $conn->close();

    http_response_code(200);
    echo json_encode(['exists' => $exists, 'email' => $email]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
