const { execute } = require('./_db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const parentEmail = (req.query.parent_email || req.headers['x-parent-email'] || '').trim();
    const deviceId    = (req.query.device_id    || req.headers['x-device-id']    || '').trim();
    if (!parentEmail || !deviceId) return res.status(400).json({ error: 'Missing credentials' });

    try {
        await execute(
            `INSERT INTO devices (device_id, parent_email, last_seen)
             VALUES (?, ?, NOW())
             ON CONFLICT (device_id) DO UPDATE SET last_seen = NOW()`,
            [deviceId, parentEmail]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
