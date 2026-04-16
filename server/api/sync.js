const zlib    = require('zlib');
const { getPool } = require('./_db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Device-ID, X-Parent-Email, Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).end();

    const parentEmail = (req.query.parent_email || req.headers['x-parent-email'] || '').trim();
    const deviceId    = (req.query.device_id    || req.headers['x-device-id']    || '').trim();
    if (!parentEmail || !deviceId) return res.status(400).json({ error: 'Missing credentials' });

    const db = getPool();
    const [chk] = await db.execute(
        "SELECT id FROM licenses WHERE parent_email = ? AND status = 'active'", [parentEmail]
    );
    if (!chk.length) return res.status(403).json({ error: 'Email not registered or inactive' });

    // Body is already parsed by Vercel as Buffer for octet-stream
    let raw = req.body;
    if (!Buffer.isBuffer(raw)) raw = Buffer.from(raw || '');
    if (!raw.length) return res.status(400).json({ error: 'Empty body' });

    let jsonStr;
    try { jsonStr = zlib.gunzipSync(raw).toString('utf8'); }
    catch { jsonStr = raw.toString('utf8'); }

    let packets;
    try { packets = JSON.parse(jsonStr); }
    catch { return res.status(400).json({ error: 'Invalid JSON payload' }); }

    if (!Array.isArray(packets) || !packets.length)
        return res.status(400).json({ error: 'Empty packet array' });

    let inserted = 0, errors = 0;

    for (const p of packets) {
        try {
            const appType = (p.appType || '').toUpperCase();
            const ts      = p.timestamp ? parseInt(p.timestamp) : Date.now();

            if (appType === 'LOCATION') {
                const loc = typeof p.content === 'string' ? JSON.parse(p.content) : (p.content || {});
                const lat = parseFloat(loc.lat), lng = parseFloat(loc.lng);
                const acc = parseFloat(loc.accuracy) || null;
                if (!isNaN(lat) && !isNaN(lng)) {
                    await db.execute(
                        'INSERT INTO locations (device_id, parent_email, lat, lng, accuracy, timestamp) VALUES (?,?,?,?,?,?)',
                        [deviceId, parentEmail, lat, lng, acc, ts]
                    );
                    inserted++;
                }
            } else {
                const content   = p.content != null ? (typeof p.content === 'string' ? p.content : JSON.stringify(p.content)) : null;
                const mediaMeta = p.mediaMeta ? JSON.stringify(p.mediaMeta) : null;
                const direction = ['SENT','RECEIVED'].includes((p.direction||'').toUpperCase()) ? p.direction.toUpperCase() : 'RECEIVED';
                await db.execute(
                    `INSERT INTO conversations (device_id, parent_email, app_type, contact_id, contact_name, thread_id, direction, content, media_meta, timestamp)
                     VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [deviceId, parentEmail, appType, p.contactId||'', p.contactName||'', p.threadId||null, direction, content, mediaMeta, ts]
                );
                inserted++;
            }
        } catch { errors++; }
    }

    try {
        await db.execute(
            'INSERT INTO devices (device_id, parent_email, last_seen) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()',
            [deviceId, parentEmail]
        );
    } catch {}

    res.json({ success: true, inserted, errors });
};
