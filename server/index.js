require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

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
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Routes ─────────────────────────────────────────────────────────────────

// User Dashboard Routes
const userRoutes = require('./routes/user');
app.use('/dashboard', userRoutes);

// ── Auth Routes ────────────────────────────────────────────────────────────

// Login page
app.get('/login', (req, res) => {
    if (req.session?.parentEmail) return res.redirect('/dashboard');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login API — stubbed (no DB)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.json({ success: false, message: 'Missing credentials' });
    }
    // TODO: connect to DB — for now allow any login for UI testing
    req.session.parentEmail = email.toLowerCase().trim();
    res.json({ success: true });
});

// Logout
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Auth check
app.get('/api/auth/check', (req, res) => {
    res.json({ logged_in: !!req.session?.parentEmail });
});

// Verify email — stubbed
app.post('/api/verify-email', (req, res) => {
    res.json({ valid: true });
});

// Sync — stubbed
app.post('/api/sync', (req, res) => {
    res.json({ success: true, inserted: 0, errors: 0 });
});

// Heartbeat — stubbed
app.get('/api/heartbeat', (req, res) => {
    res.json({ ok: true });
});

// ── Static Routes ──────────────────────────────────────────────────────────

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error Handlers ─────────────────────────────────────────────────────────

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GhostMonitor running on http://localhost:${PORT}`);
});

module.exports = app;
