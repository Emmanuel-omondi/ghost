// Dashboard API - Admin functionality (obfuscated naming for security)
const { execute } = require('./_db');

async function getDashboardStats() {
    try {
        const [rows] = await execute(`
            SELECT 
                COUNT(*) as total_packets,
                COUNT(DISTINCT user_id) as active_users,
                MAX(created_at) as last_activity
            FROM packets
        `);
        return rows[0] || {};
    } catch (error) {
        console.error('Dashboard stats error:', error);
        throw error;
    }
}

async function getSystemHealth() {
    try {
        const [rows] = await execute(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_records
            FROM sync_logs
        `);
        return rows[0] || {};
    } catch (error) {
        console.error('System health error:', error);
        throw error;
    }
}

async function getUserActivity() {
    try {
        const [rows] = await execute(`
            SELECT 
                user_id,
                COUNT(*) as packet_count,
                MAX(created_at) as last_seen
            FROM packets
            GROUP BY user_id
            ORDER BY packet_count DESC
            LIMIT 50
        `);
        return rows || [];
    } catch (error) {
        console.error('User activity error:', error);
        throw error;
    }
}

module.exports = {
    getDashboardStats,
    getSystemHealth,
    getUserActivity
};
