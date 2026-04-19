const express = require('express');
const router = express.Router();
const path = require('path');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session?.parentEmail) {
        return res.redirect('/login');
    }
    next();
};

// User Dashboard Page
router.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/user-dashboard.html'));
});

// ── Stubbed API endpoints (no DB) ──────────────────────────────────────────

router.get('/api/data', requireAuth, (req, res) => {
    const type = req.query.type || 'overview';

    if (type === 'overview') {
        return res.json({
            total_messages: 0,
            total_calls: 0,
            location_updates: 0,
            devices: []
        });
    }
    if (['whatsapp','instagram','telegram','facebook','sms'].includes(type)) {
        return res.json({ contacts: [] });
    }
    if (type === 'calls')     return res.json({ calls: [] });
    if (type === 'location' || type === 'locations') return res.json({ locations: [] });
    if (type === 'browsing')  return res.json({ history: [] });
    if (type === 'media')     return res.json({ media: [] });

    res.status(400).json({ error: 'Unknown type' });
});

router.get('/api/license', requireAuth, (req, res) => {
    res.json({ status: 'Active', days_remaining: 365 });
});

router.get('/api/devices', requireAuth, (req, res) => {
    res.json({ devices: [] });
});

router.get('/api/stats', requireAuth, (req, res) => {
    res.json({ packets: 0, conversations: 0, locations: 0 });
});

router.get('/api/search', requireAuth, (req, res) => {
    res.json({ results: [] });
});

module.exports = router;
