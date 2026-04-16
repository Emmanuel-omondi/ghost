// Security & access control API (obfuscated naming)
const { execute } = require('./_db');

async function logSecurityEvent(eventType, details, severity = 'info') {
    try {
        const [rows] = await execute(`
            INSERT INTO security_events (event_type, details, severity, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, created_at
        `, [eventType, JSON.stringify(details), severity]);
        return rows[0] || {};
    } catch (error) {
        console.error('Security log error:', error);
        throw error;
    }
}

async function getSecurityEvents(limit = 50) {
    try {
        const [rows] = await execute(`
            SELECT 
                id,
                event_type,
                details,
                severity,
                created_at
            FROM security_events
            ORDER BY created_at DESC
            LIMIT $1
        `, [limit]);
        return rows || [];
    } catch (error) {
        console.error('Get security events error:', error);
        throw error;
    }
}

async function checkAccessControl(userId, resource) {
    try {
        const [rows] = await execute(`
            SELECT access_level FROM user_permissions
            WHERE user_id = $1 AND resource = $2
        `, [userId, resource]);
        return rows[0]?.access_level || 'none';
    } catch (error) {
        console.error('Access control check error:', error);
        throw error;
    }
}

module.exports = {
    logSecurityEvent,
    getSecurityEvents,
    checkAccessControl
};
