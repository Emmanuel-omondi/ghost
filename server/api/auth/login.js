const bcrypt         = require('bcryptjs');
const { execute }    = require('../_db');
const { setSession } = require('../_session');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).end();

    // Parse body — Vercel may pass it as string or object
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const { email, password } = body;
    if (!email || !password) return res.json({ success: false, message: 'Missing credentials' });

    try {
        const [rows] = await execute(
            "SELECT * FROM licenses WHERE parent_email = $1 AND status = 'active'",
            [email.toLowerCase().trim()]
        );
        const user = rows[0];
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.json({ success: false, message: 'Invalid credentials or inactive account' });
        }
        setSession(res, { parentEmail: user.parent_email });
        res.json({ success: true });
    } catch (e) {
        console.error('[login]', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
};
