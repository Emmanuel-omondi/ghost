// Admin routes configuration (obfuscated naming for security)
// These routes provide access to admin functionality through non-obvious endpoints

const express = require('express');
const router = express.Router();
const { verifyAdminSession } = require('./auth');
const dashboard = require('./dashboard');
const audit = require('./audit');
const maintenance = require('./maintenance');
const reports = require('./reports');
const security = require('./security');
const system = require('./system');

// Middleware to verify admin access
const requireAdmin = (req, res, next) => {
    if (!verifyAdminSession(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Dashboard endpoints
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await dashboard.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/health', requireAdmin, async (req, res) => {
    try {
        const health = await dashboard.getSystemHealth();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/activity', requireAdmin, async (req, res) => {
    try {
        const activity = await dashboard.getUserActivity();
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Audit endpoints
router.get('/audit', requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit || 100;
        const offset = req.query.offset || 0;
        const logs = await audit.getAuditLog(limit, offset);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/audit', requireAdmin, async (req, res) => {
    try {
        const { adminId, action, details } = req.body;
        const result = await audit.logAdminAction(adminId, action, details);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Maintenance endpoints
router.post('/cleanup', requireAdmin, async (req, res) => {
    try {
        const daysOld = req.body.daysOld || 90;
        const result = await maintenance.cleanupOldData(daysOld);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/optimize', requireAdmin, async (req, res) => {
    try {
        const result = await maintenance.optimizeDatabase();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/status', requireAdmin, async (req, res) => {
    try {
        const status = await maintenance.getSystemStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reports endpoints
router.get('/reports/packets', requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reports.getPacketReport(startDate, endDate);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/reports/sync', requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reports.getSyncReport(startDate, endDate);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/reports/errors', requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit || 100;
        const report = await reports.getErrorReport(limit);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Security endpoints
router.get('/security/events', requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit || 50;
        const events = await security.getSecurityEvents(limit);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/security/log', requireAdmin, async (req, res) => {
    try {
        const { eventType, details, severity } = req.body;
        const result = await security.logSecurityEvent(eventType, details, severity);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// System endpoints
router.get('/system/metrics', requireAdmin, async (req, res) => {
    try {
        const metrics = await system.getSystemMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/system/users', requireAdmin, async (req, res) => {
    try {
        const stats = await system.getUserStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/system/sync', requireAdmin, async (req, res) => {
    try {
        const metrics = await system.getSyncMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
