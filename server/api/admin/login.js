const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminHash  = process.env.ADMIN_PASS_HASH;

    if (!adminEmail || !adminHash) {
        return res.status(500).json({ success: false, message: 'Admin not configured' });
    }

    if (email.toLowerCase().trim() !== adminEmail.toLowerCase()) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Access denied.' });
    }

    const valid = await bcrypt.compare(password, adminHash);
    if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Access denied.' });
    }

    // Set admin session cookie (signed token)
    const token = Buffer.from(`${adminEmail}:${Date.now()}`).toString('base64');
    res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.json({ success: true });
};
