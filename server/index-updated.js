const express = require('express');
const session = require('express-session');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const mysql = require('mysql2/promise');

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

// Dashboard Routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', dashboardRoutes);

// Admin API Routes
const adminRoutes = require('./api/admin-routes');
app.use('/api/admin', adminRoutes);

// Auth Routes
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
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const bcrypt = require('bcryptjs');
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        req.session.parentEmail = user.parent_email;
        res.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    res.json({ logged_in: !!req.session?.parentEmail });
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Redirect root to dashboard
app.get('/', (req, res) => {
    if (req.session?.parentEmail) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
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
});

module.exports = app;
