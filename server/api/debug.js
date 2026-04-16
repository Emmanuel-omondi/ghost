const bcrypt  = require('bcryptjs');
const { execute } = require('./_db');

module.exports = async (req, res) => {
    try {
        // Check what's in licenses table
        const [rows] = await execute('SELECT parent_email, status, password_hash FROM licenses LIMIT 5');
        
        // Test bcrypt with known hash
        const testHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lniW';
        const testMatch = await bcrypt.compare('password123', testHash);

        // If there's a user, test their hash too
        let userMatch = null;
        if (rows[0]) {
            userMatch = await bcrypt.compare('password123', rows[0].password_hash);
        }

        res.json({
            users: rows.map(r => ({ email: r.parent_email, status: r.status, hash: r.password_hash.substring(0,30) })),
            testHashWorks: testMatch,
            userHashMatch: userMatch
        });
    } catch (e) {
        res.json({ error: e.message });
    }
};
