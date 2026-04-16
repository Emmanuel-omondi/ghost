<?php
// Called by the Android app during setup to verify the email is registered
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require '../config.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));

if (empty($email)) {
    http_response_code(400);
    exit(json_encode(['valid' => false, 'message' => 'Email required']));
}

$stmt = $pdo->prepare("SELECT id, status FROM licenses WHERE parent_email = ?");
$stmt->execute([$email]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    exit(json_encode(['valid' => false, 'message' => 'Email not registered. Contact admin.']));
}

if ($row['status'] !== 'active') {
    exit(json_encode(['valid' => false, 'message' => 'Account is ' . $row['status'] . '. Contact admin.']));
}

echo json_encode(['valid' => true]);
?>
