const bcrypt         = require('bcryptjs');
const { execute }    = require('../_db');
const { setSession } = require('../_session');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

    const { email, password } = req.body || {};
    if (!email || !password) return res.json({ success: false, message: 'Missing credentials' });

    try {
        const [rows] = await execute(
            "SELECT * FROM licenses WHERE parent_email = ? AND status = 'active'",
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
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
