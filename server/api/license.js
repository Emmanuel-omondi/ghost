const { getPool }    = require('./_db');
const { getSession } = require('./_session');

module.exports = async (req, res) => {
    const session = getSession(req);
    if (!session?.parentEmail) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const db = getPool();
        const [rows] = await db.execute(
            `SELECT DATEDIFF(expiry_date, NOW()) as days_remaining,
                    CASE WHEN DATEDIFF(expiry_date, NOW()) > 0 AND status='active' THEN 'Active' ELSE 'Expired/Blocked' END as status
             FROM licenses WHERE parent_email = ?`,
            [session.parentEmail]
        );
        res.json(rows[0] || { status: 'No License', days_remaining: 0 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
