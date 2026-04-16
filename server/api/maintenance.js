// Maintenance API - Admin maintenance operations (obfuscated naming for security)
const { execute } = require('./_db');

async function cleanupOldData(daysOld = 90) {
    try {
        const result = await execute(`
            DELETE FROM packets
            WHERE created_at < NOW() - INTERVAL '1 day' * $1
            RETURNING id
        `, [daysOld]);
        return { deleted_count: result[0]?.length || 0 };
    } catch (error) {
        console.error('Cleanup error:', error);
        throw error;
    }
}

async function optimizeDatabase() {
    try {
        await execute('VACUUM ANALYZE');
        return { status: 'success', message: 'Database optimized' };
    } catch (error) {
        console.error('Optimization error:', error);
        throw error;
    }
}

async function getSystemStatus() {
    try {
        const [rows] = await execute(`
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
            FROM pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `);
        return rows || [];
    } catch (error) {
        console.error('System status error:', error);
        throw error;
    }
}

module.exports = {
    cleanupOldData,
    optimizeDatabase,
    getSystemStatus
};
