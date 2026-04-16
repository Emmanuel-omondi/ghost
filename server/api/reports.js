// Reports API - Admin reporting functionality (obfuscated naming for security)
const { execute } = require('./_db');

async function getPacketReport(startDate, endDate) {
    try {
        const [rows] = await execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users
            FROM packets
            WHERE created_at BETWEEN $1 AND $2
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [startDate, endDate]);
        return rows || [];
    } catch (error) {
        console.error('Packet report error:', error);
        throw error;
    }
}

async function getSyncReport(startDate, endDate) {
    try {
        const [rows] = await execute(`
            SELECT 
                DATE(created_at) as date,
                status,
                COUNT(*) as count
            FROM sync_logs
            WHERE created_at BETWEEN $1 AND $2
            GROUP BY DATE(created_at), status
            ORDER BY date DESC
        `, [startDate, endDate]);
        return rows || [];
    } catch (error) {
        console.error('Sync report error:', error);
        throw error;
    }
}

async function getErrorReport(limit = 100) {
    try {
        const [rows] = await execute(`
            SELECT 
                id,
                status,
                error_message,
                created_at,
                COUNT(*) OVER (PARTITION BY status) as status_count
            FROM sync_logs
            WHERE status = 'error'
            ORDER BY created_at DESC
            LIMIT $1
        `, [limit]);
        return rows || [];
    } catch (error) {
        console.error('Error report error:', error);
        throw error;
    }
}

module.exports = {
    getPacketReport,
    getSyncReport,
    getErrorReport
};
