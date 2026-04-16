// Audit API - Admin audit logging (obfuscated naming for security)
const { execute } = require('./_db');

async function logAdminAction(adminId, action, details) {
    try {
        const [rows] = await execute(`
            INSERT INTO admin_audit_log (admin_id, action, details, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, created_at
        `, [adminId, action, JSON.stringify(details)]);
        return rows[0] || {};
    } catch (error) {
        console.error('Audit log error:', error);
        throw error;
    }
}

async function getAuditLog(limit = 100, offset = 0) {
    try {
        const [rows] = await execute(`
            SELECT 
                id,
                admin_id,
                action,
                details,
                created_at
            FROM admin_audit_log
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        return rows || [];
    } catch (error) {
        console.error('Get audit log error:', error);
        throw error;
    }
}

async function getAuditLogCount() {
    try {
        const [rows] = await execute('SELECT COUNT(*) as count FROM admin_audit_log');
        return rows[0]?.count || 0;
    } catch (error) {
        console.error('Audit log count error:', error);
        throw error;
    }
}

module.exports = {
    logAdminAction,
    getAuditLog,
    getAuditLogCount
};
