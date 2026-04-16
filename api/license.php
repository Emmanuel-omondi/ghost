<?php
require '../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['parent_email'])) {
    http_response_code(401);
    exit(json_encode(['error' => 'Unauthorized']));
}

$email = $_SESSION['parent_email'];

$stmt = $pdo->prepare("
    SELECT 
        DATEDIFF(expiry_date, NOW()) as days_remaining,
        CASE 
            WHEN DATEDIFF(expiry_date, NOW()) > 0 AND status = 'active' THEN 'Active'
            ELSE 'Expired/Blocked'
        END as status
    FROM licenses WHERE parent_email = ?
");

$stmt->execute([$email]);
$license = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$license) {
    echo json_encode(['status' => 'No License', 'days_remaining' => 0]);
} else {
    echo json_encode($license);
}
?>