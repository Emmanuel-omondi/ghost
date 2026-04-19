const express = require('express');
const router = express.Router();
const { execute } = require('../api/_db');

// Middleware to check admin authentication
const requireAdminAuth = (req, res, next) => {
    const adminToken = req.headers['x-admin-token'] || req.query.token;
    const validTokens = (process.env.ADMIN_TOKENS || '').split(',').map(t => t.trim());
    
    // Check if admin token is valid
    if (adminToken && validTokens.includes(adminToken)) {
        req.isAdmin = true;
        return next();
    }
    
    // Check if admin session exists
    if (req.session?.isAdmin) {
        return next();
    }
    
    // Redirect to admin login if not authenticated
    return res.redirect('/sys/core/panel/x7k2m/signin.html');
};

// Admin Dashboard page
router.get('/', requireAdminAuth, (req, res) => {
    res.render('dashboard');
});

// API: Overview stats
router.get('/api/admin/overview', requireAdminAuth, async (req, res) => {
    try {
        const [packets] = await execute(`
            SELECT COUNT(*) as total FROM packets
        `);
        
        const [users] = await execute(`
            SELECT COUNT(DISTINCT user_id) as total FROM packets
        `);
        
        const [errors] = await execute(`
            SELECT COUNT(*) as total FROM sync_logs WHERE status = 'error'
        `);
        
        const [syncs] = await execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
            FROM sync_logs
        `);

        const [devices] = await execute(`
            SELECT device_id, last_seen,
                CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 3 MINUTE) THEN 'online' ELSE 'offline' END as status
            FROM devices
            ORDER BY last_seen DESC
            LIMIT 50
        `);

        const syncRate = syncs[0]?.total > 0 
            ? Math.round((syncs[0]?.success / syncs[0]?.total) * 100)
            : 0;

        res.json({
            totalPackets: packets[0]?.total || 0,
            activeUsers: users[0]?.total || 0,
            errorCount: errors[0]?.total || 0,
            syncRate: syncRate,
            devices: devices || []
        });
    } catch (error) {
        console.error('Overview error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Metrics
router.get('/api/admin/metrics', requireAdminAuth, async (req, res) => {
    try {
        const [packetsByApp] = await execute(`
            SELECT app_type, COUNT(*) as count
            FROM conversations
            GROUP BY app_type
            ORDER BY count DESC
        `);

        const [syncStatus] = await execute(`
            SELECT status, COUNT(*) as count
            FROM sync_logs
            GROUP BY status
        `);

        const [hourlyActivity] = await execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                COUNT(*) as count
            FROM packets
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')
            ORDER BY hour DESC
            LIMIT 24
        `);

        res.json({
            packetsByApp: packetsByApp || [],
            syncStatus: syncStatus || [],
            hourlyActivity: hourlyActivity || []
        });
    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Logs
router.get('/api/admin/logs', requireAdminAuth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const offset = parseInt(req.query.offset) || 0;

        const [logs] = await execute(`
            SELECT 
                id,
                status,
                error_message,
                created_at,
                updated_at
            FROM sync_logs
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [total] = await execute(`
            SELECT COUNT(*) as count FROM sync_logs
        `);

        res.json({
            logs: logs || [],
            total: total[0]?.count || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error('Logs error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Users
router.get('/api/admin/users', requireAdminAuth, async (req, res) => {
    try {
        const [users] = await execute(`
            SELECT 
                parent_email,
                COUNT(*) as packet_count,
                MAX(created_at) as last_activity,
                COUNT(DISTINCT device_id) as device_count
            FROM packets
            GROUP BY parent_email
            ORDER BY packet_count DESC
            LIMIT 100
        `);

        res.json({
            users: users || []
        });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: System Health
router.get('/api/admin/health', requireAdminAuth, async (req, res) => {
    try {
        const [health] = await execute(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as recent_records,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
            FROM sync_logs
        `);

        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        res.json({
            status: 'healthy',
            uptime: Math.floor(uptime),
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
            },
            database: health[0] || {}
        });
    } catch (error) {
        console.error('Health error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Export data
router.get('/api/admin/export', requireAdminAuth, async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const [data] = await execute(`
            SELECT 
                app_type,
                contact_name,
                content,
                direction,
                FROM_UNIXTIME(timestamp/1000) as datetime
            FROM conversations
            ORDER BY timestamp DESC
            LIMIT 10000
        `);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="ghostmonitor_${new Date().toISOString().slice(0,10)}.csv"`);
            
            res.write('App,Contact,Message,Direction,DateTime\n');
            data.forEach(row => {
                const line = [
                    row.app_type,
                    row.contact_name,
                    (row.content || '').substring(0, 200).replace(/,/g, ' '),
                    row.direction,
                    row.datetime
                ];
                res.write(line.join(',') + '\n');
            });
            res.end();
        } else {
            res.json({ data });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
