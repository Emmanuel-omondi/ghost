<?php
require '../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
    http_response_code(401);
    exit(json_encode(['error' => 'Admin access required']));
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'get_users') {
    $stmt = $pdo->query("
        SELECT id, parent_email, status, expiry_date, 
               login_history, created_at 
        FROM licenses ORDER BY expiry_date DESC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as &$user) {
        $user['days_left'] = floor((strtotime($user['expiry_date']) - time()) / 86400);
        $user['last_login'] = $user['login_history'] ? 
            end(json_decode($user['login_history'], true))['time'] ?? 'Never' : 'Never';
    }
    
    echo json_encode(['users' => $users]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'delete_user') {
        $stmt = $pdo->prepare("DELETE FROM licenses WHERE id = ?");
        $result = $stmt->execute([$_POST['user_id']]);
        echo json_encode(['success' => $result]);
        exit;
    }
    
    if ($_POST['action'] === 'update_user') {
        $stmt = $pdo->prepare("
            UPDATE licenses SET 
            expiry_date = ?, status = ?, password_hash = ? 
            WHERE id = ?
        ");
        $password_hash = !empty($_POST['password']) ? 
            password_hash($_POST['password'], PASSWORD_DEFAULT) : null;
        
        if ($password_hash) {
            $stmt->execute([
                $_POST['expiry_date'], 
                $_POST['status'], 
                $password_hash, 
                $_POST['user_id']
            ]);
        } else {
            $stmt->execute([
                $_POST['expiry_date'], 
                $_POST['status'], 
                $pdo->query("SELECT password_hash FROM licenses WHERE id = {$_POST['user_id']}")->fetchColumn(),
                $_POST['user_id']
            ]);
        }
        
        echo json_encode(['success' => true]);
        exit;
    }
    
    if ($_POST['action'] === 'get_user_data') {
        $email = $_POST['email'];
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total_records 
            FROM conversations WHERE parent_email = ?
        ");
        $stmt->execute([$email]);
        $total = $stmt->fetchColumn();
        
        echo json_encode(['total_records' => $total]);
        exit;
    }
}

if ($action === 'user_logins') {
    $email = $_GET['email'] ?? '';
    $stmt = $pdo->prepare("SELECT login_history FROM licenses WHERE parent_email = ?");
    $stmt->execute([$email]);
    $history = $stmt->fetchColumn();
    
    echo json_encode([
        'login_history' => $history ? json_decode($history, true) : []
    ]);
    exit;
}

// View any user data (admin override)
if ($action === 'view_user_data') {
    $email = $_GET['email'];
    $type = $_GET['type'] ?? 'overview';
    
    $stmt = $pdo->prepare("
        SELECT * FROM conversations 
        WHERE parent_email = ? ORDER BY timestamp DESC LIMIT 100
    ");
    $stmt->execute([$email]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}
?>