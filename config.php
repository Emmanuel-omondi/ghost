<?php
session_start();
define('DB_HOST', 'sqlXXX.infinityfree.com');
define('DB_USER', 'if0_XXXXXX');
define('DB_PASS', 'yourpassword');
define('DB_NAME', 'if0_XXXXXX_ghost');

define('ADMIN_EMAIL', 'admin@ghostmonitor.com');
define('ADMIN_PASS_HASH', password_hash('admin123', PASSWORD_DEFAULT));

try {
    $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Return JSON error so Android app can distinguish DB failure from network failure
    header('Content-Type: application/json');
    http_response_code(503);
    die(json_encode(['error' => 'Database unavailable', 'detail' => $e->getMessage()]));
}

?>