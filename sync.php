<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Device-ID, X-Parent-Email, Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require 'config.php';

$parent_email = trim($_GET['parent_email'] ?? $_SERVER['HTTP_X_PARENT_EMAIL'] ?? '');
$device_id    = trim($_GET['device_id']    ?? $_SERVER['HTTP_X_DEVICE_ID']    ?? '');

if (empty($parent_email) || empty($device_id)) {
    http_response_code(400);
    exit(json_encode(['error' => 'Missing credentials']));
}

// ── Verify email is registered ────────────────────────────────────────────────
$chk = $pdo->prepare("SELECT id FROM licenses WHERE parent_email = ? AND status = 'active'");
$chk->execute([$parent_email]);
if (!$chk->fetch()) {
    http_response_code(403);
    exit(json_encode(['error' => 'Email not registered or inactive']));
}

// ── Decode payload ────────────────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
if (empty($raw)) {
    http_response_code(400);
    exit(json_encode(['error' => 'Empty body']));
}

// Try gzip decode first, fall back to raw JSON
$json = @gzdecode($raw);
if ($json === false || $json === '') $json = $raw;

$packets = json_decode($json, true);
if (!is_array($packets) || empty($packets)) {
    http_response_code(400);
    exit(json_encode(['error' => 'Invalid payload', 'raw_len' => strlen($raw)]));
}

// ── Insert packets ────────────────────────────────────────────────────────────
$stmtConv = $pdo->prepare("
    INSERT INTO conversations
        (device_id, parent_email, app_type, contact_id, contact_name,
         thread_id, direction, content, media_meta, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmtLoc = $pdo->prepare("
    INSERT INTO locations (device_id, parent_email, lat, lng, accuracy, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
");

$inserted = 0;
$errors   = 0;

foreach ($packets as $p) {
    try {
        $appType = strtoupper($p['appType'] ?? '');
        $ts      = isset($p['timestamp']) ? (int)$p['timestamp'] : (time() * 1000);

        if ($appType === 'LOCATION') {
            $raw_content = $p['content'] ?? '';
            $loc = is_array($raw_content)
                ? $raw_content
                : json_decode($raw_content, true);

            $lat      = isset($loc['lat'])      ? (float)$loc['lat']      : null;
            $lng      = isset($loc['lng'])      ? (float)$loc['lng']      : null;
            $accuracy = isset($loc['accuracy']) ? (float)$loc['accuracy'] : null;

            if ($lat !== null && $lng !== null) {
                $stmtLoc->execute([$device_id, $parent_email, $lat, $lng, $accuracy, $ts]);
                $inserted++;
            }
        } else {
            $content   = isset($p['content'])
                ? (is_string($p['content']) ? $p['content'] : json_encode($p['content']))
                : null;
            $mediaMeta = isset($p['mediaMeta']) ? json_encode($p['mediaMeta']) : null;
            $direction = strtoupper($p['direction'] ?? 'RECEIVED');
            if (!in_array($direction, ['SENT','RECEIVED'])) $direction = 'RECEIVED';

            $stmtConv->execute([
                $device_id,
                $parent_email,
                $appType,
                $p['contactId']   ?? '',
                $p['contactName'] ?? '',
                $p['threadId']    ?? null,
                $direction,
                $content,
                $mediaMeta,
                $ts
            ]);
            $inserted++;
        }
    } catch (Exception $e) {
        $errors++;
    }
}

echo json_encode(['success' => true, 'inserted' => $inserted, 'errors' => $errors]);
?>
