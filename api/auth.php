<?php
require '../config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT * FROM licenses WHERE parent_email = ? AND status = 'active'");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['parent_email'] = $email;
        
        $history = $user['login_history'] ? json_decode($user['login_history'], true) : [];
        $history[] = ['ip' => $_SERVER['REMOTE_ADDR'], 'time' => date('Y-m-d H:i:s'), 'user_agent' => $_SERVER['HTTP_USER_AGENT']];
        $stmt = $pdo->prepare("UPDATE licenses SET login_history = ? WHERE parent_email = ?");
        $stmt->execute([json_encode(array_slice($history, -10)), $email]);
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials or inactive account']);
    }
}

if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
}

if (isset($_GET['check'])) {
    echo json_encode(['logged_in' => isset($_SESSION['parent_email'])]);
}
?>