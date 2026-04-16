<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Database connected successfully',
        'db_host' => DB_HOST,
        'db_name' => DB_NAME,
        'tables'  => $tables
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status'  => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
