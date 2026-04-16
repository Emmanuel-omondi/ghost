// System management API (obfuscated naming)
const { execute } = require('./_db');

async function getSystemMetrics() {
    try {
        const [rows] = await execute(`
            SELECT 
                (SELECT COUNT(*) FROM packets) as total_packets,
                (SELECT COUNT(DISTINCT user_id) FROM packets) as total_users,
                (SELECT COUNT(*) FROM sync_logs WHERE status = 'error') as error_count,
                (SELECT COUNT(*) FROM sync_logs WHERE created_at > NOW() - INTERVAL '24 hours') as recent_syncs
        `);
        return rows[0] || {};
    } catch (error) {
        console.error('System metrics error:', error);
        throw error;
    }
}

async function getUserStats() {
    try {
        const [rows] = await execute(`
            SELECT 
                user_id,
                COUNT(*) as packet_count,
                MAX(created_at) as last_activity,
                MIN(created_at) as first_activity
            FROM packets
            GROUP BY user_id
            ORDER BY packet_count DESC
        `);
        return rows || [];
    } catch (error) {
        console.error('User stats error:', error);
        throw error;
    }
}

async function getSyncMetrics() {
    try {
        const [rows] = await execute(`
            SELECT 
                status,
                COUNT(*) as count,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration
            FROM sync_logs
            GROUP BY status
        `);
        return rows || [];
    } catch (error) {
        console.error('Sync metrics error:', error);
        throw error;
    }
}

module.exports = {
    getSystemMetrics,
    getUserStats,
    getSyncMetrics
};
