const bcrypt         = require('bcryptjs');
const { execute }    = require('../_db');
const { setSession } = require('../_session');

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).end();

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const { email, password } = body;
    if (!email || !password) return res.json({ success: false, message: 'Missing credentials' });

    // Check against ADMIN_EMAIL env var first, then fall back to DB admin flag
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminHash  = process.env.ADMIN_PASS_HASH;

    if (adminEmail && adminHash && email.toLowerCase().trim() === adminEmail.toLowerCase()) {
        const valid = await bcrypt.compare(password, adminHash);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials. Access denied.' });
        setSession(res, { adminEmail: email.toLowerCase().trim(), isAdmin: true });
        return res.json({ success: true });
    }

    // Fall back: check licenses table for is_admin flag
    try {
        const [rows] = await execute(
            "SELECT * FROM licenses WHERE parent_email = $1 AND is_admin = true",
            [email.toLowerCase().trim()]
        );
        const user = rows && rows[0];
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials. Access denied.' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials. Access denied.' });

        setSession(res, { adminEmail: user.parent_email, isAdmin: true });
        res.json({ success: true });
    } catch (e) {
        console.error('[admin/login]', e.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
