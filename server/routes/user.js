const express = require('express');
const router = express.Router();
const { execute } = require('../api/_db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session?.parentEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// User Dashboard Page
router.get('/', requireAuth, (req, res) => {
    res.render('user-dashboard');
});

// API: Overview Data
router.get('/api/data', requireAuth, async (req, res) => {
    const email = req.session.parentEmail;
    const type = req.query.type || 'overview';
    const action = req.query.action || '';

    try {
        // Overview
        if (type === 'overview') {
            const [[stats]] = await execute(
                `SELECT COUNT(*) as total_messages,
                        SUM(CASE WHEN app_type='CALLS' THEN 1 ELSE 0 END) as total_calls
                 FROM conversations WHERE parent_email=? AND FROM_UNIXTIME(timestamp/1000)>=CURDATE()`,
                [email]
            );
            
            const [[locStats]] = await execute(
                `SELECT COUNT(*) as location_updates FROM locations
                 WHERE parent_email=? AND FROM_UNIXTIME(timestamp/1000)>=CURDATE()`,
                [email]
            );
            
            const [devices] = await execute(
                `SELECT device_id, last_seen,
                        CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 3 MINUTE) THEN 'online' ELSE 'offline' END as status
                 FROM devices WHERE parent_email=? ORDER BY last_seen DESC`,
                [email]
            );

            return res.json({
                total_messages: parseInt(stats?.total_messages) || 0,
                total_calls: parseInt(stats?.total_calls) || 0,
                location_updates: parseInt(locStats?.location_updates) || 0,
                devices: devices || []
            });
        }

        // CSV Export
        if (action === 'export') {
            const [rows] = await execute(
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

        // Messaging Apps
        const appMap = { whatsapp:'WHATSAPP', instagram:'INSTAGRAM', telegram:'TELEGRAM', facebook:'FACEBOOK', sms:'SMS' };
        if (appMap[type]) {
            const appType = appMap[type];

            if (action === 'thread') {
                const contactId = req.query.contact_id || '';
                const [msgs] = await execute(
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
            
            if (search) {
                q += ' AND (contact_name LIKE ? OR contact_id LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            
            q += ' GROUP BY contact_id, contact_name ORDER BY last_ts DESC LIMIT 200';
            const [contacts] = await execute(q, params);
            return res.json({ contacts });
        }

        // Calls
        if (type === 'calls') {
            const start = req.query.start ? new Date(req.query.start).getTime() : Date.now() - 86400000;
            const end = req.query.end ? new Date(req.query.end).getTime() : Date.now();
            const [calls] = await execute(
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
            const end = req.query.end ? new Date(req.query.end).getTime() : Date.now();
            const [locations] = await execute(
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
            const since = filter === 'week' ? Date.now() - 7*86400000 : filter === 'month' ? Date.now() - 30*86400000 : new Date().setHours(0,0,0,0);
            const [history] = await execute(
                `SELECT contact_name as title, content as url, FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=? AND app_type='BROWSING' AND timestamp>=?
                 ORDER BY timestamp DESC LIMIT 500`,
                [email, since]
            );
            return res.json({ history });
        }

        // Media
        if (type === 'media') {
            const [media] = await execute(
                `SELECT app_type, contact_name, media_meta, FROM_UNIXTIME(timestamp/1000) as datetime, timestamp
                 FROM conversations WHERE parent_email=? AND app_type='MEDIA' AND media_meta IS NOT NULL
                 ORDER BY timestamp DESC LIMIT 200`,
                [email]
            );
            return res.json({ media });
        }

        res.status(400).json({ error: 'Unknown type' });
    } catch (error) {
        console.error('Data error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: License Info
router.get('/api/license', requireAuth, async (req, res) => {
    try {
        const [rows] = await execute(
            `SELECT DATEDIFF(expiry_date, NOW()) as days_remaining,
                    CASE WHEN DATEDIFF(expiry_date, NOW()) > 0 AND status='active' THEN 'Active' ELSE 'Expired/Blocked' END as status
             FROM licenses WHERE parent_email = ?`,
            [req.session.parentEmail]
        );
        res.json(rows[0] || { status: 'No License', days_remaining: 0 });
    } catch (error) {
        console.error('License error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Device Status
router.get('/api/devices', requireAuth, async (req, res) => {
    try {
        const [devices] = await execute(
            `SELECT device_id, last_seen,
                    CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 3 MINUTE) THEN 'online' ELSE 'offline' END as status
             FROM devices WHERE parent_email=? ORDER BY last_seen DESC`,
            [req.session.parentEmail]
        );
        res.json({ devices });
    } catch (error) {
        console.error('Devices error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Statistics
router.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const email = req.session.parentEmail;
        
        const [[packets]] = await execute(
            `SELECT COUNT(*) as total FROM packets WHERE parent_email=?`,
            [email]
        );
        
        const [[conversations]] = await execute(
            `SELECT COUNT(*) as total FROM conversations WHERE parent_email=?`,
            [email]
        );
        
        const [[locations]] = await execute(
            `SELECT COUNT(*) as total FROM locations WHERE parent_email=?`,
            [email]
        );

        res.json({
            packets: packets?.total || 0,
            conversations: conversations?.total || 0,
            locations: locations?.total || 0
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Search
router.get('/api/search', requireAuth, async (req, res) => {
    try {
        const email = req.session.parentEmail;
        const query = req.query.q || '';
        
        if (!query || query.length < 2) {
            return res.json({ results: [] });
        }

        const [results] = await execute(
            `SELECT app_type, contact_name, content, FROM_UNIXTIME(timestamp/1000) as datetime
             FROM conversations WHERE parent_email=? AND (contact_name LIKE ? OR content LIKE ?)
             ORDER BY timestamp DESC LIMIT 50`,
            [email, `%${query}%`, `%${query}%`]
        );

        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
