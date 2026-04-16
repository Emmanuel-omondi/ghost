const { getPool } = require('./_db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).end();

    const email = ((req.body?.email) || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ valid: false, message: 'Email required' });

    try {
        const db = getPool();
        const [rows] = await db.execute(
            'SELECT id, status FROM licenses WHERE parent_email = ?', [email]
        );
        const row = rows[0];
        if (!row) return res.json({ valid: false, message: 'Email not registered. Contact admin.' });
        if (row.status !== 'active') return res.json({ valid: false, message: `Account is ${row.status}. Contact admin.` });
        res.json({ valid: true });
    } catch (e) {
        res.status(500).json({ valid: false, message: 'Server error' });
    }
};
