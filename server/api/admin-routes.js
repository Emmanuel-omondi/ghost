// ── ADMIN ROUTES FROZEN ────────────────────────────────────────────────────
// All admin routes are temporarily disabled. Uncomment to re-enable.

const express = require('express');
const router = express.Router();

// const { verifyAdminSession } = require('./auth');
// const dashboard = require('./dashboard');
// const audit = require('./audit');
// const maintenance = require('./maintenance');
// const reports = require('./reports');
// const security = require('./security');
// const system = require('./system');

// // Middleware to verify admin access
// const requireAdmin = (req, res, next) => {
//     if (!verifyAdminSession(req)) {
//         return res.status(401).json({ error: 'Unauthorized' });
//     }
//     next();
// };

// // Dashboard endpoints
// router.get('/stats', requireAdmin, async (req, res) => { ... });
// router.get('/health', requireAdmin, async (req, res) => { ... });
// router.get('/activity', requireAdmin, async (req, res) => { ... });

// // Audit endpoints
// router.get('/audit', requireAdmin, async (req, res) => { ... });
// router.post('/audit', requireAdmin, async (req, res) => { ... });

// // Maintenance endpoints
// router.post('/cleanup', requireAdmin, async (req, res) => { ... });
// router.post('/optimize', requireAdmin, async (req, res) => { ... });
// router.get('/status', requireAdmin, async (req, res) => { ... });

// // Reports endpoints
// router.get('/reports/packets', requireAdmin, async (req, res) => { ... });
// router.get('/reports/sync', requireAdmin, async (req, res) => { ... });
// router.get('/reports/errors', requireAdmin, async (req, res) => { ... });

// // Security endpoints
// router.get('/security/events', requireAdmin, async (req, res) => { ... });
// router.post('/security/log', requireAdmin, async (req, res) => { ... });

// // System endpoints
// router.get('/system/metrics', requireAdmin, async (req, res) => { ... });
// router.get('/system/users', requireAdmin, async (req, res) => { ... });
// router.get('/system/sync', requireAdmin, async (req, res) => { ... });

// Catch-all: return 503 for any admin API calls while frozen
router.all('*', (req, res) => {
    res.status(503).json({ error: 'Admin features are currently disabled' });
});

module.exports = router;
